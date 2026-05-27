import re
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

from app.core.limiter import limiter
from app.core.config import settings
from app.services.ai_service import generate_recipes

router = APIRouter(prefix="/api/recipes", tags=["recipes"])

_SAFE_INGREDIENT = re.compile(r"^[a-zA-Z0-9 ',.\-()&%/]+$")


class IngredientInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    amount: Optional[str] = Field(None, max_length=30)
    unit: Optional[str] = Field(None, max_length=20)

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        v = v.strip()
        if not _SAFE_INGREDIENT.match(v):
            raise ValueError("Ingredient name contains invalid characters")
        return v


class GenerateRequest(BaseModel):
    ingredients: List[IngredientInput] = Field(..., min_length=1, max_length=30)
    cuisine: Optional[str] = Field(None, max_length=50)
    dietary: List[str] = Field(default_factory=list, max_length=10)
    maxTime: int = Field(default=60, ge=5, le=480)
    skillLevel: str = Field(default="intermediate")
    servings: int = Field(default=4, ge=1, le=20)
    mode: str = Field(default="standard")

    @field_validator("skillLevel")
    @classmethod
    def validate_skill(cls, v: str) -> str:
        if v not in ("beginner", "intermediate", "advanced"):
            raise ValueError("skillLevel must be beginner, intermediate, or advanced")
        return v

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v: str) -> str:
        if v not in ("standard", "healthy", "budget", "mealprep"):
            raise ValueError("mode must be standard, healthy, budget, or mealprep")
        return v


class NutritionInfo(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    saturatedFat: Optional[float] = None


class RecipeIngredient(BaseModel):
    name: str
    amount: str
    available: bool
    substitute: Optional[str] = None


class InstructionStep(BaseModel):
    step: int
    title: str
    description: str
    time: Optional[int] = None
    tip: Optional[str] = None


class Recipe(BaseModel):
    id: str
    name: str
    description: str
    cuisine: str
    difficulty: str
    prepTime: int
    cookTime: int
    totalTime: int
    servings: int
    matchScore: int
    ingredients: List[RecipeIngredient]
    missingIngredients: List[str]
    instructions: List[InstructionStep]
    nutrition: NutritionInfo
    tips: List[str]
    storage: str
    tags: List[str]
    healthScore: Optional[int] = None


class GenerateResponse(BaseModel):
    recipes: List[Recipe]
    model: str
    usage: dict


@router.post("/generate", response_model=GenerateResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
@limiter.limit(f"{settings.RATE_LIMIT_PER_HOUR}/hour")
async def generate(request: Request, body: GenerateRequest):
    """Generate AI recipes from available ingredients."""
    try:
        result = await generate_recipes(
            ingredients=[i.model_dump() for i in body.ingredients],
            cuisine=body.cuisine,
            dietary=body.dietary,
            max_time=body.maxTime,
            skill_level=body.skillLevel,
            servings=body.servings,
            mode=body.mode,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recipe generation failed: {str(e)}",
        )


@router.get("/health")
async def health():
    return {"status": "ok", "service": "recipes"}
