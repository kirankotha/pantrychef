'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X, Clock, Users, Flame, ChefHat, Heart, CheckCircle2,
  Lightbulb, Package, ShoppingCart, Star, BookOpen
} from 'lucide-react'
import NutritionTable from './NutritionTable'
import { useAppStore } from '@/store/useAppStore'
import { cn, formatTime, getCuisineGradient } from '@/lib/utils'
import type { Recipe } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  recipe: Recipe
  onClose: () => void
}

type Tab = 'instructions' | 'ingredients' | 'nutrition' | 'tips'

export default function RecipeDetail({ recipe, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('instructions')
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set())
  const { saveRecipe, unsaveRecipe, isSaved } = useAppStore()
  const saved = isSaved(recipe.id)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const toggleStep = (i: number) =>
    setCheckedSteps(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const handleSave = () => {
    if (saved) { unsaveRecipe(recipe.id); toast('Removed from saved') }
    else { saveRecipe(recipe); toast.success('Recipe saved!') }
  }

  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : []
  const tips = Array.isArray(recipe.tips) ? recipe.tips : []
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const missingIngredients = Array.isArray(recipe.missingIngredients) ? recipe.missingIngredients : []

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'instructions', label: 'Steps', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'ingredients', label: 'Ingredients', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'nutrition', label: 'Nutrition', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'tips', label: 'Tips', icon: <Lightbulb className="w-3.5 h-3.5" /> },
  ]

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — is itself the scroll container; no overflow-hidden parent trapping scroll */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
        className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero header — overflow-hidden only here for rounding, not on the scroll parent */}
        <div className={cn(
          'relative p-5 pb-6 bg-gradient-to-br flex-shrink-0 rounded-t-3xl sm:rounded-t-3xl overflow-hidden',
          getCuisineGradient(recipe.cuisine)
        )}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="pr-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">{recipe.cuisine}</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                recipe.difficulty === 'Easy' ? 'bg-green-500/20 text-white' :
                recipe.difficulty === 'Medium' ? 'bg-amber-500/20 text-white' : 'bg-red-500/20 text-white'
              )}>{recipe.difficulty}</span>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">{recipe.name}</h2>
            <p className="text-white/80 text-xs mt-1 line-clamp-2">{recipe.description}</p>
          </div>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {[
              { icon: <Clock className="w-3.5 h-3.5" />, label: formatTime(recipe.totalTime) },
              { icon: <Flame className="w-3.5 h-3.5" />, label: `${recipe.nutrition?.calories ?? 0} kcal` },
              { icon: <Users className="w-3.5 h-3.5" />, label: `${recipe.servings} servings` },
              { icon: <Star className="w-3.5 h-3.5" />, label: `${recipe.matchScore}% match` },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1 text-white/90 text-xs font-medium">{icon}{label}</div>
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
          <button onClick={handleSave} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
            saved ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'
          )}>
            <Heart className={cn('w-3.5 h-3.5', saved && 'fill-current')} />
            {saved ? 'Saved' : 'Save Recipe'}
          </button>
          {missingIngredients.length > 0 && (
            <button
              onClick={() => toast.success(`Need: ${missingIngredients.slice(0, 3).join(', ')}${missingIngredients.length > 3 ? '…' : ''}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-600"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Shopping ({missingIngredients.length})
            </button>
          )}
          <div className="ml-auto flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1.5 rounded-xl border border-green-200">
            <ChefHat className="w-3.5 h-3.5" />
            <span>{recipe.matchScore}%</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 flex-shrink-0 bg-white">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-orange-600 border-orange-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scroll area — sibling of overflow-hidden header, not its child */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <div className="p-4 space-y-3">

            {activeTab === 'instructions' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{instructions.length} steps · tap to mark done</p>
                </div>
                {instructions.map((step, idx) => {
                  const stepNum = step.step ?? idx + 1
                  const done = checkedSteps.has(stepNum)
                  return (
                    <div
                      key={stepNum}
                      onClick={() => toggleStep(stepNum)}
                      className={cn(
                        'flex gap-4 p-4 rounded-2xl border cursor-pointer transition-colors select-none',
                        done ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 active:bg-orange-50/50'
                      )}
                    >
                      <div className="flex-shrink-0">
                        {done
                          ? <CheckCircle2 className="w-7 h-7 text-green-500 fill-green-100" />
                          : <div className="step-number">{stepNum}</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={cn('font-semibold text-sm', done ? 'text-green-700 line-through' : 'text-gray-900')}>
                          {step.title}
                        </h4>
                        <p className={cn('text-xs mt-1 leading-relaxed', done ? 'text-green-600' : 'text-gray-600')}>
                          {step.description}
                        </p>
                        {step.time && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                            <Clock className="w-3 h-3" /> {step.time} min
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {recipe.storage && (
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Storage</p>
                    <p className="text-xs text-blue-600">{recipe.storage}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Available</h3>
                  {ingredients.filter(i => i.available).map(ing => (
                    <div key={ing.name} className="flex items-center gap-3 py-2 px-3 bg-green-50 rounded-xl border border-green-100">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900">{ing.name}</span>
                      {ing.amount && <span className="text-sm text-gray-500 ml-1">— {ing.amount}</span>}
                      {ing.substitute && <span className="ml-auto text-xs text-gray-400">sub: {ing.substitute}</span>}
                    </div>
                  ))}
                </div>
                {missingIngredients.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-amber-700">Need to buy</h3>
                    {ingredients.filter(i => !i.available).map(ing => (
                      <div key={ing.name} className="flex items-center gap-3 py-2 px-3 bg-amber-50 rounded-xl border border-amber-100">
                        <ShoppingCart className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">{ing.name}</span>
                        {ing.amount && <span className="text-sm text-gray-500 ml-1">— {ing.amount}</span>}
                        {ing.substitute && <span className="ml-auto text-xs text-orange-600">→ {ing.substitute}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'nutrition' && (
              <NutritionTable nutrition={recipe.nutrition} servings={recipe.servings} />
            )}

            {activeTab === 'tips' && (
              <div className="space-y-3">
                {tips.map((tip, i) => (
                  <div key={i} className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </>
  )
}
