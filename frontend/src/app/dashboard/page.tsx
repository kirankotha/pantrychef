'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ChevronDown, ChevronUp, Clock, Users,
  Zap, Leaf, DollarSign, Package, SlidersHorizontal,
  RefreshCw, AlertCircle
} from 'lucide-react'
import Header from '@/components/Header'
import IngredientInput from '@/components/IngredientInput'
import CuisineSelector from '@/components/CuisineSelector'
import DietaryFilters from '@/components/DietaryFilters'
import RecipeCard from '@/components/RecipeCard'
import RecipeDetail from '@/components/RecipeDetail'
import { useAppStore } from '@/store/useAppStore'
import type { CookingMode, CuisineType, DietaryOption, Recipe } from '@/types'
import toast from 'react-hot-toast'

const COOKING_MODES: { value: CookingMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'standard', label: 'Standard', icon: <Sparkles className="w-4 h-4" />, desc: 'Balanced meals' },
  { value: 'healthy', label: 'Healthy', icon: <Leaf className="w-4 h-4" />, desc: 'Light & nutritious' },
  { value: 'budget', label: 'Budget', icon: <DollarSign className="w-4 h-4" />, desc: 'Cost-effective' },
  { value: 'mealprep', label: 'Meal Prep', icon: <Package className="w-4 h-4" />, desc: '3-day batches' },
]

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', emoji: '👶' },
  { value: 'intermediate', label: 'Intermediate', emoji: '👨‍🍳' },
  { value: 'advanced', label: 'Advanced', emoji: '⭐' },
]

function GeneratingSkeleton() {
  return (
    <div className="recipe-grid">
      {[1, 2, 3].map(i => (
        <div key={i} className="card overflow-hidden">
          <div className="shimmer h-36" />
          <div className="p-4 space-y-3">
            <div className="shimmer h-5 rounded-lg w-3/4" />
            <div className="shimmer h-3 rounded-lg w-full" />
            <div className="shimmer h-3 rounded-lg w-2/3" />
            <div className="flex gap-2 mt-3">
              <div className="shimmer h-6 rounded-full w-16" />
              <div className="shimmer h-6 rounded-full w-20" />
            </div>
            <div className="shimmer h-10 rounded-xl w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const {
    ingredients, generateOptions, updateOptions,
    recipes, setRecipes, isGenerating, setIsGenerating, setActiveRecipe,
  } = useAppStore()

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      toast.error('Add at least one ingredient first!')
      return
    }

    setIsGenerating(true)
    setError(null)
    setRecipes([])

    try {
      const res = await fetch('/pantrychef/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          cuisine: generateOptions.cuisine,
          dietary: generateOptions.dietary,
          maxTime: generateOptions.maxTime,
          skillLevel: generateOptions.skillLevel,
          servings: generateOptions.servings,
          mode: generateOptions.mode,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      if (data.recipes?.length) {
        setRecipes(data.recipes)
        toast.success(`Found ${data.recipes.length} recipes for you!`)
      } else {
        setError('No recipes found. Try different ingredients or remove some filters.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setActiveRecipe(recipe)
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* === LEFT PANEL (Filters) === */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-4">
            {/* Mobile: toggle filter panel */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between p-4 card font-medium text-gray-900 text-sm"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-orange-500" />
                  Filters & Preferences
                  {(generateOptions.cuisine || generateOptions.dietary.length > 0) && (
                    <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs">
                      {(generateOptions.cuisine ? 1 : 0) + generateOptions.dietary.length}
                    </span>
                  )}
                </div>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {(showFilters || isDesktop) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="lg:!opacity-100 lg:!h-auto overflow-hidden lg:overflow-visible space-y-4"
                >
                  {/* Ingredient input */}
                  <div className="card p-4">
                    <IngredientInput />
                  </div>

                  {/* Cooking mode */}
                  <div className="card p-4 space-y-3">
                    <div>
                      <h2 className="font-semibold text-gray-900 text-sm">Cooking Mode</h2>
                      <p className="text-xs text-gray-500 mt-0.5">How should we optimize recipes?</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {COOKING_MODES.map(({ value, label, icon, desc }) => (
                        <button
                          key={value}
                          onClick={() => updateOptions({ mode: value })}
                          className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all text-xs ${
                            generateOptions.mode === value
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-semibold">
                            {icon} {label}
                          </div>
                          <span className="text-gray-400">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cuisine */}
                  <div className="card p-4">
                    <CuisineSelector
                      selected={generateOptions.cuisine}
                      onChange={(cuisine) => updateOptions({ cuisine: cuisine as CuisineType | '' })}
                    />
                  </div>

                  {/* Dietary */}
                  <div className="card p-4">
                    <DietaryFilters
                      selected={generateOptions.dietary as DietaryOption[]}
                      onChange={(dietary) => updateOptions({ dietary })}
                    />
                  </div>

                  {/* Time, servings, skill */}
                  <div className="card p-4 space-y-4">
                    <h2 className="font-semibold text-gray-900 text-sm">Cooking Preferences</h2>

                    {/* Max time */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" /> Max time
                        </label>
                        <span className="text-xs font-semibold text-orange-600">
                          {generateOptions.maxTime === 120 ? '2h+' : `${generateOptions.maxTime}m`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={15} max={120} step={5}
                        value={generateOptions.maxTime}
                        onChange={e => updateOptions({ maxTime: Number(e.target.value) })}
                        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>15m</span><span>30m</span><span>60m</span><span>2h+</span>
                      </div>
                    </div>

                    {/* Servings */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" /> Servings
                        </label>
                        <span className="text-xs font-semibold text-orange-600">{generateOptions.servings}</span>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 4, 6, 8].map(n => (
                          <button
                            key={n}
                            onClick={() => updateOptions({ servings: n })}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              generateOptions.servings === n
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Skill level */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-600">Skill level</label>
                      <div className="flex gap-2">
                        {SKILL_LEVELS.map(({ value, label, emoji }) => (
                          <button
                            key={value}
                            onClick={() => updateOptions({ skillLevel: value as 'beginner' | 'intermediate' | 'advanced' })}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              generateOptions.skillLevel === value
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            {emoji} {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate button */}
            <motion.button
              onClick={handleGenerate}
              disabled={isGenerating || ingredients.length === 0}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                ingredients.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'btn-primary text-base'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating recipes...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {recipes.length > 0 ? 'Regenerate' : 'Generate Recipes'}
                  {ingredients.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-sm">
                      {ingredients.length} items
                    </span>
                  )}
                </>
              )}
            </motion.button>

            {ingredients.length === 0 && (
              <p className="text-center text-xs text-gray-400 -mt-2">
                Add ingredients above to get started
              </p>
            )}
          </div>

          {/* === RIGHT PANEL (Results) === */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-display">
                  {recipes.length > 0
                    ? `${recipes.length} Recipe${recipes.length !== 1 ? 's' : ''} Found`
                    : 'Recipe Generator'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {recipes.length > 0
                    ? 'Sorted by ingredient match score'
                    : 'Add ingredients and hit Generate'}
                </p>
              </div>
              {recipes.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                  <Zap className="w-3.5 h-3.5" />
                  AI Generated
                </div>
              )}
            </div>

            {/* States */}
            {isGenerating && <GeneratingSkeleton />}

            {error && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 text-sm">Generation failed</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  {error.includes('API key') && (
                    <p className="text-red-500 text-xs mt-2">
                      Create a <code className="bg-red-100 px-1 rounded">.env.local</code> file with{' '}
                      <code className="bg-red-100 px-1 rounded">OPENAI_API_KEY=sk-...</code>
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {!isGenerating && !error && recipes.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-orange-300" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Ready to cook?</h3>
                <p className="text-gray-400 text-sm max-w-xs">
                  Add the ingredients from your kitchen on the left, then hit Generate to discover amazing recipes.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {['🍗 chicken', '🍚 rice', '🧄 garlic', '🍅 tomato', '🧅 onion'].map(ex => (
                    <span key={ex} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">{ex}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {!isGenerating && recipes.length > 0 && (
              <div className="recipe-grid">
                {recipes.map((recipe, i) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    index={i}
                    onView={handleViewRecipe}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recipe detail modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            onClose={() => { setSelectedRecipe(null); setActiveRecipe(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
