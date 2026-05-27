'use client'

import { motion } from 'framer-motion'
import { Clock, Users, Flame, Star, Heart, ChevronRight, Award } from 'lucide-react'
import { cn, formatTime, getCuisineGradient, getDifficultyColor, getMatchScoreColor } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import type { Recipe } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  recipe: Recipe
  index?: number
  onView: (recipe: Recipe) => void
}

export default function RecipeCard({ recipe, index = 0, onView }: Props) {
  const { saveRecipe, unsaveRecipe, isSaved } = useAppStore()
  const saved = isSaved(recipe.id)

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (saved) {
      unsaveRecipe(recipe.id)
      toast('Removed from saved recipes')
    } else {
      saveRecipe(recipe)
      toast.success('Recipe saved!')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onClick={() => onView(recipe)}
      className="card-hover cursor-pointer overflow-hidden group"
    >
      {/* Header gradient */}
      <div className={cn(
        'relative h-36 bg-gradient-to-br flex items-end p-4',
        getCuisineGradient(recipe.cuisine)
      )}>
        {/* Match badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1">
          <Award className="w-3 h-3 text-orange-500" />
          <span className={cn('text-xs font-bold', getMatchScoreColor(recipe.matchScore))}>
            {recipe.matchScore}% match
          </span>
        </div>

        {/* Save button */}
        <motion.button
          onClick={handleSave}
          whileTap={{ scale: 0.9 }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <Heart className={cn('w-4 h-4', saved ? 'fill-red-500 text-red-500' : 'text-gray-500')} />
        </motion.button>

        {/* Cuisine + difficulty */}
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
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors">
            {recipe.name}
          </h3>
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{recipe.description}</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {formatTime(recipe.totalTime)}
          </span>
          <span className="flex items-center gap-1 font-semibold text-orange-600">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            {recipe.nutrition.calories} kcal
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            {recipe.servings}
          </span>
        </div>

        {/* Macro badges */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
            P {recipe.nutrition.protein}g
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
            C {recipe.nutrition.carbs}g
          </span>
          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
            F {recipe.nutrition.fat}g
          </span>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Missing ingredients warning */}
        {recipe.missingIngredients.length > 0 && (
          <div className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <Star className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Missing: {recipe.missingIngredients.slice(0, 2).join(', ')}
              {recipe.missingIngredients.length > 2 && ` +${recipe.missingIngredients.length - 2} more`}
            </p>
          </div>
        )}

        {/* CTA */}
        <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-200 group">
          View Recipe
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  )
}
