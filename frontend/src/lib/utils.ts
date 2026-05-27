import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Ingredient } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Easy': return 'text-green-600 bg-green-50 border-green-200'
    case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'Hard': return 'text-red-600 bg-red-50 border-red-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function getMatchScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-500'
}

export function getHealthScoreColor(score: number): string {
  if (score >= 8) return '#22c55e'
  if (score >= 6) return '#f59e0b'
  return '#ef4444'
}

export function getCuisineGradient(cuisine: string): string {
  const gradients: Record<string, string> = {
    Indian: 'from-orange-400 to-red-500',
    Italian: 'from-green-400 to-emerald-600',
    Mexican: 'from-red-400 to-orange-500',
    Chinese: 'from-red-500 to-rose-600',
    Thai: 'from-purple-400 to-pink-500',
    Mediterranean: 'from-blue-400 to-cyan-500',
    American: 'from-blue-500 to-indigo-600',
    Japanese: 'from-pink-400 to-rose-500',
    Korean: 'from-rose-400 to-red-500',
    'Middle Eastern': 'from-amber-400 to-yellow-500',
    Fusion: 'from-violet-400 to-purple-600',
  }
  return gradients[cuisine] || 'from-gray-400 to-gray-600'
}

export const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  cilantro: ['coriander', 'chinese parsley'],
  coriander: ['cilantro', 'chinese parsley'],
  aubergine: ['eggplant', 'brinjal'],
  eggplant: ['aubergine', 'brinjal'],
  courgette: ['zucchini'],
  zucchini: ['courgette'],
  capsicum: ['bell pepper', 'sweet pepper'],
  'bell pepper': ['capsicum', 'sweet pepper'],
  scallion: ['green onion', 'spring onion'],
  'spring onion': ['scallion', 'green onion'],
  'heavy cream': ['double cream', 'whipping cream'],
  'double cream': ['heavy cream', 'whipping cream'],
}

export function normalizIngredient(name: string): string {
  const lower = name.toLowerCase().trim()
  for (const [canonical, synonyms] of Object.entries(INGREDIENT_SYNONYMS)) {
    if (synonyms.includes(lower)) return canonical
  }
  return lower
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export const COMMON_INGREDIENTS: string[] = [
  'chicken breast', 'chicken thighs', 'ground beef', 'salmon', 'shrimp', 'tofu',
  'eggs', 'milk', 'butter', 'heavy cream', 'yogurt', 'cheese', 'mozzarella', 'parmesan',
  'rice', 'pasta', 'bread', 'flour', 'oats', 'quinoa', 'lentils', 'chickpeas',
  'olive oil', 'vegetable oil', 'sesame oil',
  'onion', 'garlic', 'ginger', 'tomato', 'potato', 'carrot', 'broccoli', 'spinach',
  'bell pepper', 'mushroom', 'zucchini', 'eggplant', 'corn', 'peas', 'cucumber',
  'lemon', 'lime', 'orange', 'apple', 'banana', 'avocado',
  'soy sauce', 'fish sauce', 'oyster sauce', 'hot sauce', 'ketchup', 'mustard',
  'cumin', 'coriander', 'turmeric', 'paprika', 'chili powder', 'oregano', 'basil',
  'thyme', 'rosemary', 'bay leaves', 'black pepper', 'salt', 'sugar', 'honey',
  'tomato paste', 'coconut milk', 'vegetable broth', 'chicken broth',
  'canned tomatoes', 'kidney beans', 'black beans',
]

export function getIngredientSuggestions(query: string, existingIds: string[]): string[] {
  const normalized = query.toLowerCase()
  return COMMON_INGREDIENTS
    .filter(ing => ing.includes(normalized) && !existingIds.includes(ing))
    .slice(0, 8)
}

export function parseIngredientFromText(text: string): Partial<Ingredient> {
  const quantityRegex = /^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(cup|cups|tbsp|tsp|oz|lb|kg|g|ml|l|piece|pieces|clove|cloves|bunch|can|cans)?\s+(.+)$/i
  const match = text.match(quantityRegex)
  if (match) {
    return { amount: match[1], unit: match[2], name: match[3].trim() }
  }
  return { name: text.trim() }
}
