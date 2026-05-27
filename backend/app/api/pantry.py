import base64
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.ai_service import detect_ingredients_from_image
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/pantry", tags=["pantry"])


class DetectedIngredients(BaseModel):
    ingredients: List[str]
    confidence: str = "medium"


class AutocompleteResponse(BaseModel):
    suggestions: List[str]


INGREDIENTS_DB = [
    "chicken breast", "chicken thighs", "ground beef", "salmon", "shrimp", "tofu",
    "eggs", "milk", "butter", "heavy cream", "yogurt", "cheddar cheese", "mozzarella",
    "parmesan", "cream cheese", "sour cream",
    "white rice", "brown rice", "basmati rice", "pasta", "spaghetti", "penne",
    "bread", "flour", "oats", "quinoa", "lentils", "chickpeas", "kidney beans",
    "olive oil", "vegetable oil", "coconut oil", "sesame oil",
    "onion", "garlic", "ginger", "tomato", "potato", "carrot", "broccoli",
    "spinach", "kale", "bell pepper", "mushroom", "zucchini", "eggplant",
    "corn", "peas", "frozen peas", "cucumber", "celery", "leek", "asparagus",
    "lemon", "lime", "orange", "apple", "banana", "avocado",
    "soy sauce", "fish sauce", "oyster sauce", "hot sauce", "ketchup", "mustard",
    "worcestershire sauce", "tabasco", "sriracha",
    "cumin", "coriander", "turmeric", "paprika", "chili powder", "oregano",
    "basil", "thyme", "rosemary", "bay leaves", "black pepper", "salt",
    "sugar", "brown sugar", "honey", "maple syrup",
    "tomato paste", "canned tomatoes", "coconut milk", "vegetable broth",
    "chicken broth", "beef broth",
    "baking powder", "baking soda", "vanilla extract", "cornstarch",
]


@router.get("/autocomplete", response_model=AutocompleteResponse)
async def autocomplete(query: str, limit: int = 8):
    """Return ingredient suggestions based on partial input."""
    if len(query) < 2:
        return AutocompleteResponse(suggestions=[])

    q = query.lower()
    exact = [i for i in INGREDIENTS_DB if i.startswith(q)]
    fuzzy = [i for i in INGREDIENTS_DB if q in i and i not in exact]
    suggestions = (exact + fuzzy)[:limit]

    return AutocompleteResponse(suggestions=suggestions)


@router.post("/detect-from-image", response_model=DetectedIngredients)
async def detect_from_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Detect ingredients from a pantry/fridge photo using GPT-4 Vision."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    max_size = 10 * 1024 * 1024  # 10MB
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    try:
        image_b64 = base64.b64encode(content).decode()
        ingredients = await detect_ingredients_from_image(image_b64)
        return DetectedIngredients(ingredients=ingredients[:30])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@router.get("/categories")
async def get_categories():
    return {
        "categories": [
            {"name": "Proteins", "items": ["chicken", "beef", "fish", "tofu", "eggs"]},
            {"name": "Vegetables", "items": ["tomato", "onion", "garlic", "carrot", "broccoli"]},
            {"name": "Grains", "items": ["rice", "pasta", "bread", "oats", "quinoa"]},
            {"name": "Dairy", "items": ["milk", "butter", "cheese", "yogurt", "cream"]},
            {"name": "Pantry", "items": ["olive oil", "soy sauce", "spices", "flour", "sugar"]},
        ]
    }
