'use client'

import { motion } from 'framer-motion'
import {
  User, ChefHat, Heart, Calendar, Sparkles,
  Settings, Trash2, Star, BarChart3
} from 'lucide-react'
import Header from '@/components/Header'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { savedRecipes, ingredients, recipes, clearIngredients } = useAppStore()

  const cuisineCounts = savedRecipes.reduce<Record<string, number>>((acc, r) => {
    acc[r.cuisine] = (acc[r.cuisine] || 0) + 1
    return acc
  }, {})

  const topCuisine = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const avgCalories = savedRecipes.length > 0
    ? Math.round(savedRecipes.reduce((a, r) => a + r.nutrition.calories, 0) / savedRecipes.length)
    : 0

  const handleClearData = () => {
    if (confirm('This will clear all saved recipes and ingredients. Continue?')) {
      clearIngredients()
      toast.success('Data cleared')
    }
  }

  const stats = [
    { label: 'Saved Recipes', value: savedRecipes.length, icon: <Heart className="w-5 h-5" />, color: 'red', href: '/saved' },
    { label: 'Pantry Items', value: ingredients.length, icon: <ChefHat className="w-5 h-5" />, color: 'orange', href: '/dashboard' },
    { label: 'Generated', value: recipes.length, icon: <Sparkles className="w-5 h-5" />, color: 'amber', href: '/dashboard' },
    { label: 'Avg Calories', value: avgCalories, icon: <BarChart3 className="w-5 h-5" />, color: 'blue', href: '/saved' },
  ]

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-brand">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-display">Your Kitchen Profile</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {topCuisine ? `Favorite cuisine: ${topCuisine}` : 'Start saving recipes to see your stats'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon, color, href }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link href={href} className={cn(
                'block card p-4 text-center hover:shadow-card-hover transition-all',
                `hover:border-${color}-200`
              )}>
                <div className={cn(
                  'w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center',
                  `bg-${color}-50 text-${color}-500`
                )}>
                  {icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Favorite cuisines */}
        {Object.keys(cuisineCounts).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-5"
          >
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Your Cuisine Preferences
            </h2>
            <div className="space-y-2.5">
              {Object.entries(cuisineCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([cuisine, count]) => (
                  <div key={cuisine} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-28">{cuisine}</span>
                    <div className="flex-1 nutrition-bar">
                      <motion.div
                        className="nutrition-bar-fill bg-gradient-to-r from-orange-400 to-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / savedRecipes.length) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            Settings
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">OpenAI API Key</p>
                <p className="text-xs text-gray-400 mt-0.5">Required for recipe generation</p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                Set in .env.local
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Data Storage</p>
                <p className="text-xs text-gray-400 mt-0.5">Saved locally in your browser</p>
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                Private
              </span>
            </div>

            <button
              onClick={handleClearData}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors py-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear all local data
            </button>
          </div>
        </motion.div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/dashboard', icon: <Sparkles className="w-5 h-5" />, label: 'Generate', color: 'orange' },
            { href: '/saved', icon: <Heart className="w-5 h-5" />, label: 'Saved', color: 'red' },
            { href: '/planner', icon: <Calendar className="w-5 h-5" />, label: 'Planner', color: 'purple' },
          ].map(({ href, icon, label, color }) => (
            <Link key={href} href={href} className="card p-4 text-center hover:shadow-card-hover transition-all">
              <div className={cn('w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center', `bg-${color}-50 text-${color}-500`)}>
                {icon}
              </div>
              <p className="text-sm font-medium text-gray-700">{label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
