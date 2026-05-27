from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class SavedRecipe(Base):
    __tablename__ = "saved_recipes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipe_id = Column(String, nullable=False)
    recipe_name = Column(String, nullable=False)
    cuisine = Column(String)
    difficulty = Column(String)
    prep_time = Column(Integer)
    cook_time = Column(Integer)
    total_time = Column(Integer)
    servings = Column(Integer)
    match_score = Column(Integer)
    recipe_data = Column(JSON, nullable=False)  # Full recipe JSON
    notes = Column(Text, nullable=True)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_recipes")


class PantryItem(Base):
    __tablename__ = "pantry_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    amount = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    category = Column(String, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="pantry_items")


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    week_start = Column(String, nullable=False)
    plan_data = Column(JSON, nullable=False)  # {day: {breakfast, lunch, dinner, snack}}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="meal_plans")


class RecipeCache(Base):
    """Cache generated recipes to avoid redundant AI calls."""
    __tablename__ = "recipe_cache"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cache_key = Column(String, unique=True, nullable=False, index=True)
    recipes = Column(JSON, nullable=False)
    hits = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
