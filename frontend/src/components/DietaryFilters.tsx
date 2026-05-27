'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { DietaryOption } from '@/types'

const DIETARY_OPTIONS: { value: DietaryOption; label: string; emoji: string; desc: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗', desc: 'No meat' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱', desc: 'No animal products' },
  { value: 'keto', label: 'Keto', emoji: '🥑', desc: 'Low-carb, high-fat' },
  { value: 'high-protein', label: 'High Protein', emoji: '💪', desc: '30g+ protein' },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒', desc: 'Heart healthy' },
  { value: 'gluten-free', label: 'Gluten Free', emoji: '🌾', desc: 'No gluten' },
  { value: 'dairy-free', label: 'Dairy Free', emoji: '🥛', desc: 'No dairy' },
  { value: 'low-carb', label: 'Low Carb', emoji: '📉', desc: 'Under 20g carbs' },
  { value: 'fertility-friendly', label: 'Fertility', emoji: '🌸', desc: 'Hormone supportive' },
  { value: 'kids-friendly', label: 'Kid Friendly', emoji: '👶', desc: 'Mild flavors' },
]

interface Props {
  selected: DietaryOption[]
  onChange: (dietary: DietaryOption[]) => void
}

export default function DietaryFilters({ selected, onChange }: Props) {
  const toggle = (value: DietaryOption) => {
    onChange(
      selected.includes(value)
        ? selected.filter(d => d !== value)
        : [...selected, value]
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold text-gray-900 text-sm">Dietary Preferences</h2>
        <p className="text-xs text-gray-500 mt-0.5">Select all that apply</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {DIETARY_OPTIONS.map(({ value, label, emoji }) => {
          const active = selected.includes(value)
          return (
            <motion.button
              key={value}
              onClick={() => toggle(value)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 cursor-pointer',
                active
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
              )}
            >
              <span>{emoji}</span>
              {label}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
