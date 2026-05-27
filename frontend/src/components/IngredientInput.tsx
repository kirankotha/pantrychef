'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search, ChefHat } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { getIngredientSuggestions, parseIngredientFromText, cn } from '@/lib/utils'

const CUISINE_STARTERS: Record<string, string[]> = {
  Indian: ['chicken', 'rice', 'onion', 'garlic', 'ginger', 'tomato', 'turmeric', 'cumin'],
  Italian: ['pasta', 'tomato', 'garlic', 'olive oil', 'basil', 'parmesan', 'mozzarella'],
  Mexican: ['chicken', 'black beans', 'corn', 'tomato', 'lime', 'avocado', 'jalapeño'],
  Chinese: ['chicken', 'rice', 'soy sauce', 'ginger', 'garlic', 'sesame oil', 'broccoli'],
  Thai: ['coconut milk', 'chicken', 'lemongrass', 'lime', 'fish sauce', 'basil', 'chili'],
}

export default function IngredientInput() {
  const { ingredients, addIngredient, removeIngredient, clearIngredients, generateOptions } = useAppStore()
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = useCallback((value: string) => {
    setInput(value)
    if (value.trim().length >= 2) {
      const sugg = getIngredientSuggestions(value, ingredients.map(i => i.name.toLowerCase()))
      setSuggestions(sugg)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [ingredients])

  const handleAdd = useCallback((name?: string) => {
    const val = name || input
    if (!val.trim()) return
    const parsed = parseIngredientFromText(val)
    if (parsed.name) {
      addIngredient(parsed.name, parsed.amount)
      setInput('')
      setSuggestions([])
      setShowSuggestions(false)
      inputRef.current?.focus()
    }
  }, [input, addIngredient])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
    if (e.key === 'Escape') setShowSuggestions(false)
    if (e.key === ',' || e.key === ';') {
      e.preventDefault()
      if (input.trim()) handleAdd()
    }
  }

  const loadStarters = (cuisine: string) => {
    const starters = CUISINE_STARTERS[cuisine] || []
    starters.forEach(ing => addIngredient(ing))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">Your Ingredients</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {ingredients.length > 0
              ? `${ingredients.length} ingredient${ingredients.length !== 1 ? 's' : ''} added`
              : 'Add what\'s in your kitchen'}
          </p>
        </div>
        {ingredients.length > 0 && (
          <button
            onClick={clearIngredients}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Input field */}
      <div className="relative">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => input.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Type an ingredient... (press Enter or comma)"
              className="input-base pl-10 pr-4"
              autoComplete="off"
            />
          </div>
          <motion.button
            onClick={() => handleAdd()}
            disabled={!input.trim()}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all',
              input.trim()
                ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-brand hover:shadow-brand-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Autocomplete dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-12 mt-1 bg-white border border-gray-200 rounded-xl shadow-card-hover z-50 overflow-hidden"
            >
              {suggestions.map(suggestion => (
                <button
                  key={suggestion}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors flex items-center gap-2"
                  onMouseDown={() => handleAdd(suggestion)}
                >
                  <ChefHat className="w-3.5 h-3.5 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick starters */}
      {ingredients.length === 0 && generateOptions.cuisine && CUISINE_STARTERS[generateOptions.cuisine] && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Quick start for {generateOptions.cuisine}:</p>
          <button
            onClick={() => loadStarters(generateOptions.cuisine)}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium underline-offset-2 hover:underline"
          >
            Add common {generateOptions.cuisine} ingredients
          </button>
        </div>
      )}

      {/* Ingredient tags */}
      <AnimatePresence>
        {ingredients.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1"
          >
            {ingredients.map(ingredient => (
              <motion.div
                key={ingredient.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="tag-removable group"
                onClick={() => removeIngredient(ingredient.id)}
              >
                <span>{ingredient.name}</span>
                {ingredient.amount && (
                  <span className="text-orange-400 text-xs">({ingredient.amount})</span>
                )}
                <X className="w-3 h-3 text-orange-400 group-hover:text-orange-600 transition-colors" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {ingredients.length === 0 && (
        <div className="py-6 text-center border-2 border-dashed border-gray-200 rounded-xl">
          <ChefHat className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No ingredients yet</p>
          <p className="text-xs text-gray-300 mt-1">Try typing "chicken" or "pasta"</p>
        </div>
      )}
    </div>
  )
}
