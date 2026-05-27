'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { CuisineType } from '@/types'

const CUISINES: { type: CuisineType; emoji: string; label: string }[] = [
  { type: 'Indian', emoji: '🇮🇳', label: 'Indian' },
  { type: 'Italian', emoji: '🇮🇹', label: 'Italian' },
  { type: 'Mexican', emoji: '🇲🇽', label: 'Mexican' },
  { type: 'Chinese', emoji: '🇨🇳', label: 'Chinese' },
  { type: 'Thai', emoji: '🇹🇭', label: 'Thai' },
  { type: 'Mediterranean', emoji: '🌊', label: 'Mediterranean' },
  { type: 'American', emoji: '🇺🇸', label: 'American' },
  { type: 'Japanese', emoji: '🇯🇵', label: 'Japanese' },
  { type: 'Korean', emoji: '🇰🇷', label: 'Korean' },
  { type: 'Middle Eastern', emoji: '🌙', label: 'Middle Eastern' },
  { type: 'Fusion', emoji: '✨', label: 'Fusion' },
]

interface Props {
  selected: string
  onChange: (cuisine: CuisineType | '') => void
}

export default function CuisineSelector({ selected, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold text-gray-900 text-sm">Cuisine</h2>
        <p className="text-xs text-gray-500 mt-0.5">Optional — leave blank for any</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {CUISINES.map(({ type, emoji, label }) => {
          const active = selected === type
          return (
            <motion.button
              key={type}
              onClick={() => onChange(active ? '' : type)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'relative flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer',
                active
                  ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-[0_0_0_2px_#fed7aa]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600'
              )}
            >
              <span className="text-xl leading-none">{emoji}</span>
              <span className="leading-tight text-center">{label}</span>
              {active && (
                <motion.div
                  layoutId="cuisine-active"
                  className="absolute inset-0 rounded-xl border-2 border-orange-400 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
