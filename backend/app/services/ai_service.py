import json
import hashlib
import logging
from typing import List, Optional

from openai import AsyncOpenAI, RateLimitError, APIStatusError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.core.config import settings
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            max_retries=0,  # tenacity handles retries
        )
    return _client


SYSTEM_PROMPT = """You are PantryChef, an expert professional chef and nutritionist with 20 years of experience across world cuisines. Generate creative, delicious, and practical recipes.

CRITICAL RULES:
1. Return ONLY valid JSON — no markdown code blocks, no explanation text, nothing else.
2. Generate exactly 3-4 recipes that best match available ingredients.
3. Prioritize recipes that use the MAXIMUM number of available ingredients.
4. All nutrition values must be realistic estimates.
5. Instructions must be clear, detailed, and numbered.
6. Include realistic ingredient substitutions for missing items.
7. Match score (0-100) = percentage of recipe ingredients the user already has.

Return this EXACT JSON structure:
{
  "recipes": [
    {
      "id": "unique_alphanumeric_id",
      "name": "Recipe Name",
      "description": "One vivid, appetizing sentence describing the dish.",
      "cuisine": "cuisine type",
      "difficulty": "Easy",
      "prepTime": 15,
      "cookTime": 30,
      "totalTime": 45,
      "servings": 4,
      "matchScore": 85,
      "ingredients": [
        {"name": "chicken breast", "amount": "500g", "available": true, "substitute": null},
        {"name": "paprika", "amount": "1 tsp", "available": false, "substitute": "cayenne pepper or skip"}
      ],
      "missingIngredients": ["paprika"],
      "instructions": [
        {"step": 1, "title": "Prepare the chicken", "description": "Cut the chicken breast into 2cm cubes. Season with salt and black pepper.", "time": 5, "tip": null},
        {"step": 2, "title": "Sauté aromatics", "description": "Heat 2 tbsp olive oil in a large pan over medium-high heat. Add diced onion and cook for 3-4 minutes until softened.", "time": 5, "tip": "Don't let the garlic burn — it will make the dish bitter."}
      ],
      "nutrition": {
        "calories": 420,
        "protein": 38,
        "carbs": 35,
        "fat": 14,
        "fiber": 4,
        "sugar": 6,
        "sodium": 680,
        "saturatedFat": 3
      },
      "tips": [
        "Marinate the chicken for at least 30 minutes for deeper flavor.",
        "Add a squeeze of lemon at the end for brightness.",
        "This dish pairs beautifully with warm naan bread."
      ],
      "storage": "Store in an airtight container in the refrigerator for up to 3 days. Reheat gently with a splash of water to prevent drying.",
      "tags": ["high-protein", "one-pot", "family-friendly"],
      "healthScore": 8
    }
  ]
}"""


def build_cache_key(
    ingredients: List[str],
    cuisine: str,
    dietary: List[str],
    max_time: int,
    skill_level: str,
    servings: int,
    mode: str,
) -> str:
    data = f"{sorted(ingredients)}|{cuisine}|{sorted(dietary)}|{max_time}|{skill_level}|{servings}|{mode}"
    return "pantrychef:recipes:" + hashlib.md5(data.encode()).hexdigest()


@retry(
    retry=retry_if_exception_type((RateLimitError, APIStatusError)),
    stop=stop_after_attempt(settings.GROQ_MAX_RETRIES),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
async def _call_groq(messages: list, temperature: float = 0.8) -> any:
    return await _get_client().chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=settings.GROQ_MAX_TOKENS,
        response_format={"type": "json_object"},
    )


async def generate_recipes(
    ingredients: List[dict],
    cuisine: Optional[str],
    dietary: List[str],
    max_time: int,
    skill_level: str,
    servings: int,
    mode: str,
) -> dict:
    ingredient_names = [i["name"] for i in ingredients]
    cache_key = build_cache_key(ingredient_names, cuisine or "", dietary, max_time, skill_level, servings, mode)

    redis = await get_redis()
    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                logger.info("Cache hit for key %s", cache_key[-8:])
                return json.loads(cached)
        except Exception as e:
            logger.warning("Redis get failed: %s", e)

    ingredient_list = ", ".join(
        f"{i.get('amount', '')} {i['name']}".strip() for i in ingredients
    )

    mode_instructions = {
        "healthy": "Focus on low-calorie, nutrient-dense meals. Use lots of vegetables, lean proteins, minimal oil and sugar. Each recipe should be under 500 calories per serving.",
        "budget": "Focus on budget-friendly, economical meals. Use simple pantry staples and avoid expensive ingredients. Suggest the most affordable preparation methods.",
        "mealprep": "Create recipes ideal for batch cooking. They must store well for 3-5 days, reheat easily, and taste good cold or hot. Include explicit storage and reheating instructions.",
        "standard": "Create balanced, delicious everyday meals that are satisfying and practical.",
    }

    user_prompt = f"""Available ingredients: {ingredient_list}

User preferences:
- Cuisine: {cuisine or 'any cuisine (be creative)'}
- Dietary restrictions: {', '.join(dietary) if dietary else 'none'}
- Maximum total cooking time: {max_time} minutes
- Cook's skill level: {skill_level}
- Number of servings: {servings} people
- Cooking mode: {mode}

Mode instruction: {mode_instructions.get(mode, mode_instructions['standard'])}

Generate 3-4 creative recipes that maximize use of the available ingredients. For any missing ingredients, suggest realistic substitutions using common pantry items."""

    logger.info("Calling Groq for %d ingredients, mode=%s", len(ingredients), mode)
    response = await _call_groq([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ])

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Empty response from Groq")

    parsed = json.loads(content)
    recipes = parsed.get("recipes", [])
    recipes.sort(key=lambda r: r.get("matchScore", 0), reverse=True)

    result = {
        "recipes": recipes,
        "model": response.model,
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
        },
    }

    if redis:
        try:
            await redis.setex(cache_key, settings.CACHE_TTL, json.dumps(result))
            logger.info("Cached recipes under key %s (TTL=%ds)", cache_key[-8:], settings.CACHE_TTL)
        except Exception as e:
            logger.warning("Redis set failed: %s", e)

    return result


async def detect_ingredients_from_image(image_base64: str) -> List[str]:
    raise NotImplementedError("Image detection is not available with the Groq provider.")


async def generate_cooking_tip(recipe_name: str, step: str) -> str:
    response = await _get_client().chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": f"Give me ONE practical chef tip for this cooking step from {recipe_name}: '{step}'. Keep it under 2 sentences, practical and specific."
            }
        ],
        max_tokens=100,
        temperature=0.7,
    )
    return response.choices[0].message.content or ""
