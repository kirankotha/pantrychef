'use client'

import { motion } from 'framer-motion'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import type { NutritionInfo } from '@/types'

interface Props {
  nutrition: NutritionInfo
  servings: number
}

const MACRO_COLORS = {
  protein: '#3b82f6',
  carbs: '#f59e0b',
  fat: '#ec4899',
  fiber: '#22c55e',
}

export default function NutritionTable({ nutrition, servings }: Props) {
  const perServing = {
    calories: Math.round(nutrition.calories / servings),
    protein: Math.round(nutrition.protein / servings),
    carbs: Math.round(nutrition.carbs / servings),
    fat: Math.round(nutrition.fat / servings),
    fiber: Math.round((nutrition.fiber || 0) / servings),
  }

  const totalMacroCalories = perServing.protein * 4 + perServing.carbs * 4 + perServing.fat * 9
  const proteinPct = Math.round((perServing.protein * 4 / totalMacroCalories) * 100)
  const carbsPct = Math.round((perServing.carbs * 4 / totalMacroCalories) * 100)
  const fatPct = Math.round((perServing.fat * 9 / totalMacroCalories) * 100)

  const macros = [
    { name: 'Protein', value: perServing.protein, unit: 'g', pct: proteinPct, color: MACRO_COLORS.protein, dailyPct: Math.round((perServing.protein / 50) * 100) },
    { name: 'Carbs', value: perServing.carbs, unit: 'g', pct: carbsPct, color: MACRO_COLORS.carbs, dailyPct: Math.round((perServing.carbs / 275) * 100) },
    { name: 'Fat', value: perServing.fat, unit: 'g', pct: fatPct, color: MACRO_COLORS.fat, dailyPct: Math.round((perServing.fat / 78) * 100) },
    { name: 'Fiber', value: perServing.fiber, unit: 'g', pct: 0, color: MACRO_COLORS.fiber, dailyPct: Math.round((perServing.fiber / 28) * 100) },
  ]

  const chartData = [
    { name: 'Protein', value: proteinPct, fill: MACRO_COLORS.protein },
    { name: 'Carbs', value: carbsPct, fill: MACRO_COLORS.carbs },
    { name: 'Fat', value: fatPct, fill: MACRO_COLORS.fat },
  ]

  return (
    <div className="space-y-4">
      {/* Calorie spotlight */}
      <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
        <div className="relative w-24 h-24 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%" innerRadius="55%" outerRadius="90%"
              data={chartData} startAngle={90} endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={4} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{perServing.calories}</span>
            <span className="text-xs text-gray-500">kcal</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Per serving</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{perServing.calories} <span className="text-sm font-normal text-gray-500">calories</span></p>
          <p className="text-xs text-gray-400 mt-1">Total: {nutrition.calories} kcal for {servings} servings</p>
        </div>
      </div>

      {/* Macro bars */}
      <div className="space-y-3">
        {macros.map((macro, i) => (
          <motion.div
            key={macro.name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: macro.color }} />
                <span className="font-medium text-gray-700">{macro.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold text-gray-900">{macro.value}{macro.unit}</span>
                <span className="text-gray-400">·</span>
                <span>{macro.dailyPct}% DV</span>
              </div>
            </div>
            <div className="nutrition-bar">
              <motion.div
                className="nutrition-bar-fill"
                style={{ background: macro.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(macro.dailyPct, 100)}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 + 0.2, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional nutrients */}
      {(nutrition.sodium || nutrition.sugar || nutrition.saturatedFat) && (
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          {nutrition.sodium && (
            <div className="text-center p-2 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">Sodium</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{Math.round(nutrition.sodium / servings)}mg</p>
            </div>
          )}
          {nutrition.sugar && (
            <div className="text-center p-2 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">Sugar</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{Math.round(nutrition.sugar / servings)}g</p>
            </div>
          )}
          {nutrition.saturatedFat && (
            <div className="text-center p-2 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">Sat. Fat</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{Math.round(nutrition.saturatedFat / servings)}g</p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        % Daily Values based on a 2,000 calorie diet
      </p>
    </div>
  )
}
