'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Search, Trash2, Clock, Flame, BookOpen, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import RecipeDetail from '@/components/RecipeDetail'
import { useAppStore } from '@/store/useAppStore'
import { cn, formatTime, getCuisineGradient, getDifficultyColor } from '@/lib/utils'
import type { Recipe } from '@/types'

export default function SavedPage() {
  const { savedRecipes, unsaveRecipe } = useAppStore()
  const [query, setQuery] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const filtered = savedRecipes.filter(r =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(query.toLowerCase()) ||
    r.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              Saved Recipes
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {savedRecipes.length} recipe{savedRecipes.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          {savedRecipes.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search saved..."
                className="input-base pl-9 py-2 text-sm w-48 sm:w-64"
              />
            </div>
          )}
        </div>

        {savedRecipes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-red-200" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg mb-2">No saved recipes yet</h2>
            <p className="text-gray-400 text-sm mb-6">
              Generate recipes and tap the heart icon to save your favorites here.
            </p>
            <Link href="/dashboard" className="btn-primary text-sm px-6 py-2.5">
              <Sparkles className="w-4 h-4" />
              Generate Recipes
            </Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No recipes match &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          <div className="recipe-grid">
            {filtered.map((recipe, i) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card-hover overflow-hidden group cursor-pointer"
                onClick={() => setSelectedRecipe(recipe)}
              >
                {/* Gradient header */}
                <div className={cn(
                  'relative h-32 bg-gradient-to-br flex items-end p-4',
                  getCuisineGradient(recipe.cuisine)
                )}>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
                      {recipe.cuisine}
                    </span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      recipe.difficulty === 'Easy' ? 'bg-green-500/20 text-white' :
                      recipe.difficulty === 'Medium' ? 'bg-amber-500/20 text-white' :
                      'bg-red-500/20 text-white'
                    )}>
                      {recipe.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); unsaveRecipe(recipe.id) }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatTime(recipe.totalTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400" /> {recipe.nutrition.calories} kcal
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Saved {new Date(recipe.savedAt || '').toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
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
