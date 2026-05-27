'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Ingredient, Recipe, SavedRecipe, MealPlan,
  CuisineType, DietaryOption, SkillLevel, CookingMode
} from '@/types'
import { generateId } from '@/lib/utils'

interface GenerateOptions {
  cuisine: CuisineType | ''
  dietary: DietaryOption[]
  maxTime: number
  skillLevel: SkillLevel
  servings: number
  mode: CookingMode
}

interface AppState {
  ingredients: Ingredient[]
  generateOptions: GenerateOptions
  recipes: Recipe[]
  isGenerating: boolean
  savedRecipes: SavedRecipe[]
  mealPlans: MealPlan[]
  activeRecipe: Recipe | null

  addIngredient: (name: string, amount?: string) => void
  removeIngredient: (id: string) => void
  clearIngredients: () => void
  updateOptions: (options: Partial<GenerateOptions>) => void
  setRecipes: (recipes: Recipe[]) => void
  setIsGenerating: (v: boolean) => void
  setActiveRecipe: (recipe: Recipe | null) => void
  saveRecipe: (recipe: Recipe) => void
  unsaveRecipe: (id: string) => void
  isSaved: (id: string) => boolean
  addMealPlan: (plan: MealPlan) => void
}

const defaultOptions: GenerateOptions = {
  cuisine: '',
  dietary: [],
  maxTime: 60,
  skillLevel: 'intermediate',
  servings: 4,
  mode: 'standard',
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ingredients: [],
      generateOptions: defaultOptions,
      recipes: [],
      isGenerating: false,
      savedRecipes: [],
      mealPlans: [],
      activeRecipe: null,

      addIngredient: (name, amount) => {
        const existing = get().ingredients.find(
          i => i.name.toLowerCase() === name.toLowerCase()
        )
        if (existing) return
        set(state => ({
          ingredients: [...state.ingredients, {
            id: generateId(),
            name: name.trim(),
            amount: amount?.trim(),
          }]
        }))
      },

      removeIngredient: (id) =>
        set(state => ({ ingredients: state.ingredients.filter(i => i.id !== id) })),

      clearIngredients: () => set({ ingredients: [] }),

      updateOptions: (options) =>
        set(state => ({ generateOptions: { ...state.generateOptions, ...options } })),

      setRecipes: (recipes) => set({ recipes }),

      setIsGenerating: (v) => set({ isGenerating: v }),

      setActiveRecipe: (recipe) => set({ activeRecipe: recipe }),

      saveRecipe: (recipe) => {
        const existing = get().savedRecipes.find(r => r.id === recipe.id)
        if (existing) return
        set(state => ({
          savedRecipes: [
            { ...recipe, isFavorite: true, savedAt: new Date().toISOString() },
            ...state.savedRecipes,
          ]
        }))
      },

      unsaveRecipe: (id) =>
        set(state => ({ savedRecipes: state.savedRecipes.filter(r => r.id !== id) })),

      isSaved: (id) => get().savedRecipes.some(r => r.id === id),

      addMealPlan: (plan) =>
        set(state => ({ mealPlans: [plan, ...state.mealPlans] })),
    }),
    {
      name: 'pantrychef-store',
      partialize: (state) => ({
        ingredients: state.ingredients,
        generateOptions: state.generateOptions,
        savedRecipes: state.savedRecipes,
        mealPlans: state.mealPlans,
      }),
    }
  )
)
