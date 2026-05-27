export interface Ingredient {
  id: string
  name: string
  amount?: string
  unit?: string
  category?: string
  emoji?: string
}

export interface RecipeIngredient {
  name: string
  amount: string
  available: boolean
  substitute?: string
}

export interface InstructionStep {
  step: number
  title: string
  description: string
  time?: number
  tip?: string
}

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  saturatedFat?: number
  cholesterol?: number
  vitaminC?: number
  iron?: number
  calcium?: number
}

export interface Recipe {
  id: string
  name: string
  description: string
  cuisine: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  prepTime: number
  cookTime: number
  totalTime: number
  servings: number
  matchScore: number
  ingredients: RecipeIngredient[]
  missingIngredients: string[]
  instructions: InstructionStep[]
  nutrition: NutritionInfo
  tips: string[]
  storage: string
  tags: string[]
  image?: string
  isFavorite?: boolean
  healthScore?: number
  budgetScore?: number
  createdAt?: string
}

export interface GenerateRequest {
  ingredients: Ingredient[]
  cuisine: string
  dietary: string[]
  maxTime: number
  skillLevel: string
  servings: number
  mode: 'standard' | 'healthy' | 'budget' | 'mealprep'
}

export type DietaryOption =
  | 'vegetarian'
  | 'vegan'
  | 'keto'
  | 'high-protein'
  | 'mediterranean'
  | 'gluten-free'
  | 'dairy-free'
  | 'low-carb'
  | 'fertility-friendly'
  | 'kids-friendly'

export type CuisineType =
  | 'Indian'
  | 'Italian'
  | 'Mexican'
  | 'Chinese'
  | 'Thai'
  | 'Mediterranean'
  | 'American'
  | 'Japanese'
  | 'Korean'
  | 'Middle Eastern'
  | 'Fusion'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

export type CookingMode = 'standard' | 'healthy' | 'budget' | 'mealprep'

export interface MealPlanDay {
  day: string
  breakfast?: Recipe
  lunch?: Recipe
  dinner?: Recipe
  snack?: Recipe
}

export interface MealPlan {
  id: string
  week: string
  days: MealPlanDay[]
}

export interface SavedRecipe extends Recipe {
  savedAt: string
  notes?: string
}

export interface ShoppingListItem {
  name: string
  amount: string
  category: string
  checked: boolean
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  preferences: {
    cuisines: CuisineType[]
    dietary: DietaryOption[]
    skillLevel: SkillLevel
    servings: number
    defaultCookingMode: CookingMode
  }
  stats: {
    recipesGenerated: number
    favoritesSaved: number
    mealsCooked: number
  }
}
