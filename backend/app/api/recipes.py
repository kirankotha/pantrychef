from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import List, Optional
from app.core.database import get_db
from app.services.ai_service import generate_recipes
import json

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


class IngredientInput(BaseModel):
    name: str
    amount: Optional[str] = None
    unit: Optional[str] = None


class GenerateRequest(BaseModel):
    ingredients: List[IngredientInput] = Field(..., min_items=1)
    cuisine: Optional[str] = None
    dietary: List[str] = Field(default_factory=list)
    maxTime: int = Field(default=60, ge=5, le=480)
    skillLevel: str = Field(default="intermediate")
    servings: int = Field(default=4, ge=1, le=20)
    mode: str = Field(default="standard")


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
async def generate(request: GenerateRequest):
    """Generate recipes using AI based on available ingredients."""
    if not request.ingredients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one ingredient is required"
        )

    try:
        result = await generate_recipes(
            ingredients=[i.dict() for i in request.ingredients],
            cuisine=request.cuisine,
            dietary=request.dietary,
            max_time=request.maxTime,
            skill_level=request.skillLevel,
            servings=request.servings,
            mode=request.mode,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recipe generation failed: {str(e)}"
        )


@router.get("/health")
async def health():
    return {"status": "ok", "service": "recipes"}
