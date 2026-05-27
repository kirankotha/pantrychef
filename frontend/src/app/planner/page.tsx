'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, Trash2, ShoppingCart, Download,
  ChefHat, Sparkles, Clock, Flame, CheckSquare
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import RecipeDetail from '@/components/RecipeDetail'
import { useAppStore } from '@/store/useAppStore'
import { cn, formatTime, getCuisineGradient } from '@/lib/utils'
import type { Recipe, MealPlanDay } from '@/types'
import toast from 'react-hot-toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const

function MealSlot({
  day, slot, recipe, savedRecipes, onAdd, onRemove, onView
}: {
  day: string
  slot: typeof MEAL_SLOTS[number]
  recipe?: Recipe
  savedRecipes: Recipe[]
  onAdd: (day: string, slot: typeof MEAL_SLOTS[number], recipe: Recipe) => void
  onRemove: (day: string, slot: typeof MEAL_SLOTS[number]) => void
  onView: (recipe: Recipe) => void
}) {
  const [picking, setPicking] = useState(false)

  const slotEmoji: Record<typeof MEAL_SLOTS[number], string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎',
  }

  return (
    <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border-b border-gray-200">
        <span className="text-sm">{slotEmoji[slot]}</span>
        <span className="text-xs font-semibold text-gray-500 capitalize">{slot}</span>
      </div>

      {recipe ? (
        <div className="p-2.5 space-y-1.5">
          <div
            className={cn('h-12 rounded-lg bg-gradient-to-r cursor-pointer', getCuisineGradient(recipe.cuisine))}
            onClick={() => onView(recipe)}
          />
          <div>
            <p
              className="text-xs font-semibold text-gray-900 line-clamp-1 cursor-pointer hover:text-orange-600"
              onClick={() => onView(recipe)}
            >
              {recipe.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{formatTime(recipe.totalTime)}</span>
              <span className="flex items-center gap-0.5"><Flame className="w-3 h-3" />{recipe.nutrition.calories}</span>
            </div>
          </div>
          <button
            onClick={() => onRemove(day, slot)}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        </div>
      ) : (
        <div className="p-2.5">
          {picking ? (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {savedRecipes.length > 0 ? savedRecipes.map(r => (
                <button
                  key={r.id}
                  onClick={() => { onAdd(day, slot, r); setPicking(false) }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-orange-50 hover:text-orange-700 text-gray-600 transition-colors truncate"
                >
                  {r.name}
                </button>
              )) : (
                <p className="text-xs text-gray-400 text-center py-2">
                  Save recipes first to add them here
                </p>
              )}
              <button
                onClick={() => setPicking(false)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setPicking(true)}
              className="w-full py-3 flex flex-col items-center gap-1 text-gray-300 hover:text-orange-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs">Add meal</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function PlannerPage() {
  const { savedRecipes } = useAppStore()
  const [plan, setPlan] = useState<Record<string, Partial<Record<typeof MEAL_SLOTS[number], Recipe>>>>(
    () => Object.fromEntries(DAYS.map(d => [d, {}]))
  )
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const addMeal = (day: string, slot: typeof MEAL_SLOTS[number], recipe: Recipe) => {
    setPlan(prev => ({ ...prev, [day]: { ...prev[day], [slot]: recipe } }))
  }

  const removeMeal = (day: string, slot: typeof MEAL_SLOTS[number]) => {
    setPlan(prev => {
      const day_data = { ...prev[day] }
      delete day_data[slot]
      return { ...prev, [day]: day_data }
    })
  }

  const totalMeals = Object.values(plan).reduce(
    (acc, day) => acc + Object.values(day).filter(Boolean).length, 0
  )

  const totalCalories = Object.values(plan).reduce(
    (acc, day) => acc + Object.values(day).reduce(
      (a, r) => a + (r?.nutrition.calories || 0), 0
    ), 0
  )

  const shoppingList = () => {
    const ingredients = new Set<string>()
    Object.values(plan).forEach(day => {
      Object.values(day).forEach(recipe => {
        recipe?.missingIngredients.forEach(i => ingredients.add(i))
      })
    })
    const list = [...ingredients]
    if (list.length === 0) {
      toast.success('You have everything you need!')
    } else {
      toast.success(`Shopping list: ${list.slice(0, 3).join(', ')}${list.length > 3 ? '...' : ''}`)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display flex items-center gap-2">
              <Calendar className="w-6 h-6 text-orange-500" />
              Weekly Meal Planner
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {totalMeals > 0
                ? `${totalMeals} meals planned · ${totalCalories.toLocaleString()} total calories`
                : 'Plan your meals for the week'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {totalMeals > 0 && (
              <button
                onClick={shoppingList}
                className="btn-secondary text-sm px-4 py-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Shopping List
              </button>
            )}
            <Link href="/dashboard" className="btn-primary text-sm px-4 py-2">
              <Sparkles className="w-4 h-4" />
              Generate Recipes
            </Link>
          </div>
        </div>

        {savedRecipes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3"
          >
            <ChefHat className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Save recipes first</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Generate recipes in the dashboard and save your favorites — then add them to your meal plan here.
                <Link href="/dashboard" className="ml-1 underline">Go to Dashboard →</Link>
              </p>
            </div>
          </motion.div>
        )}

        {/* Weekly grid */}
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-7 gap-3 min-w-[900px]">
            {DAYS.map(day => (
              <div key={day} className="space-y-2">
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-sm">{day.slice(0, 3)}</p>
                  <p className="text-xs text-gray-400">{day}</p>
                </div>
                {MEAL_SLOTS.map(slot => (
                  <MealSlot
                    key={slot}
                    day={day}
                    slot={slot}
                    recipe={plan[day][slot]}
                    savedRecipes={savedRecipes}
                    onAdd={addMeal}
                    onRemove={removeMeal}
                    onView={setSelectedRecipe}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        {totalMeals > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 card p-5"
          >
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-orange-500" />
              Week Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <p className="text-2xl font-bold text-orange-600">{totalMeals}</p>
                <p className="text-xs text-gray-500 mt-0.5">Meals planned</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{Math.round(totalCalories / 7)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Avg daily kcal</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{7 * 4 - totalMeals}</p>
                <p className="text-xs text-gray-500 mt-0.5">Slots remaining</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">
                  {[...new Set(Object.values(plan).flatMap(d => Object.values(d).map(r => r?.cuisine).filter(Boolean)))].length}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Cuisines</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetail recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
