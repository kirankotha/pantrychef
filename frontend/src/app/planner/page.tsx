'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, Trash2, ShoppingCart,
  ChefHat, Sparkles, Clock, Flame, CheckSquare,
  Dumbbell, Leaf, Zap, ChevronDown, ChevronUp,
  RefreshCw, AlertCircle, Download, X
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import RecipeDetail from '@/components/RecipeDetail'
import { useAppStore } from '@/store/useAppStore'
import { cn, formatTime, getCuisineGradient } from '@/lib/utils'
import type { Recipe, MealPlanDay, DietPlanType, GeneratedDietPlan, DietDay, DietMeal } from '@/types'
import toast from 'react-hot-toast'

// ─── Manual planner ──────────────────────────────────────────────────────────

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
    breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎',
  }

  return (
    <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border-b border-gray-200">
        <span className="text-sm">{slotEmoji[slot]}</span>
        <span className="text-xs font-semibold text-gray-500 capitalize">{slot}</span>
      </div>
      {recipe ? (
        <div className="p-2.5 space-y-1.5">
          <div className={cn('h-12 rounded-lg bg-gradient-to-r cursor-pointer', getCuisineGradient(recipe.cuisine))} onClick={() => onView(recipe)} />
          <div>
            <p className="text-xs font-semibold text-gray-900 line-clamp-1 cursor-pointer hover:text-orange-600" onClick={() => onView(recipe)}>{recipe.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{formatTime(recipe.totalTime)}</span>
              <span className="flex items-center gap-0.5 text-orange-500 font-medium"><Flame className="w-3 h-3" />{recipe.nutrition.calories}</span>
            </div>
          </div>
          <button onClick={() => onRemove(day, slot)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        </div>
      ) : (
        <div className="p-2.5">
          {picking ? (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {savedRecipes.length > 0 ? savedRecipes.map(r => (
                <button key={r.id} onClick={() => { onAdd(day, slot, r); setPicking(false) }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-orange-50 hover:text-orange-700 text-gray-600 transition-colors truncate">
                  {r.name}
                </button>
              )) : (
                <p className="text-xs text-gray-400 text-center py-2">Save recipes first</p>
              )}
              <button onClick={() => setPicking(false)} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setPicking(true)} className="w-full py-3 flex flex-col items-center gap-1 text-gray-300 hover:text-orange-400 transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-xs">Add meal</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── AI Diet Plan ─────────────────────────────────────────────────────────────

const DIET_TYPES: { value: DietPlanType; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  {
    value: 'protein',
    label: 'Protein Diet',
    icon: <Dumbbell className="w-5 h-5" />,
    desc: 'High-protein for muscle building & satiety',
    color: 'border-blue-400 bg-blue-50 text-blue-700',
  },
  {
    value: 'gm',
    label: 'GM Diet',
    icon: <Leaf className="w-5 h-5" />,
    desc: '7-day General Motors detox cleanse',
    color: 'border-green-400 bg-green-50 text-green-700',
  },
  {
    value: 'hybrid',
    label: 'Hybrid Diet',
    icon: <Zap className="w-5 h-5" />,
    desc: 'Balanced blend of multiple diet principles',
    color: 'border-purple-400 bg-purple-50 text-purple-700',
  },
]

const CALORIE_TARGETS = [1200, 1500, 1800, 2000, 2500]

const CUISINES = [
  { value: '', label: 'Any', emoji: '🌍' },
  { value: 'Indian', label: 'Indian', emoji: '🇮🇳' },
  { value: 'Italian', label: 'Italian', emoji: '🇮🇹' },
  { value: 'Mediterranean', label: 'Mediterranean', emoji: '🌊' },
  { value: 'Mexican', label: 'Mexican', emoji: '🇲🇽' },
  { value: 'Chinese', label: 'Chinese', emoji: '🇨🇳' },
  { value: 'Japanese', label: 'Japanese', emoji: '🇯🇵' },
  { value: 'Thai', label: 'Thai', emoji: '🇹🇭' },
  { value: 'American', label: 'American', emoji: '🇺🇸' },
  { value: 'Middle Eastern', label: 'Middle Eastern', emoji: '🌙' },
  { value: 'Korean', label: 'Korean', emoji: '🇰🇷' },
]

const MEAL_SLOT_META: { key: keyof Omit<DietDay, 'day' | 'totalCalories' | 'totalProtein' | 'totalCarbs' | 'totalFat'>; emoji: string; label: string }[] = [
  { key: 'breakfast', emoji: '🌅', label: 'Breakfast' },
  { key: 'lunch', emoji: '☀️', label: 'Lunch' },
  { key: 'dinner', emoji: '🌙', label: 'Dinner' },
  { key: 'snack', emoji: '🍎', label: 'Snack' },
]

function MacroPills({ p, c, f }: { p: number; c: number; f: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">P {p}g</span>
      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">C {c}g</span>
      <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">F {f}g</span>
    </div>
  )
}

function DietMealCard({ meal, emoji, label }: { meal: DietMeal; emoji: string; label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base">{emoji}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-bold text-gray-900 line-clamp-1">{meal.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-2 flex-shrink-0">
          <span className="flex items-center gap-1 text-sm font-semibold text-orange-600">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            {meal.calories}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
              <MacroPills p={meal.protein} c={meal.carbs} f={meal.fat} />

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Ingredients</p>
                <div className="space-y-1">
                  {meal.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{ing.name}</span>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span>{ing.amount}</span>
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{ing.grams}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Instructions</p>
                <ol className="space-y-1">
                  {meal.instructions.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-600">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3 h-3" /> Prep time: {meal.prepTime} min
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DietDayCard({ dayData, defaultOpen }: { dayData: DietDay; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <span className="text-sm font-bold text-orange-600">{dayData.day.slice(0, 3)}</span>
          </div>
          <div>
            <p className="font-bold text-gray-900">{dayData.day}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
                <Flame className="w-3 h-3" />{dayData.totalCalories} kcal
              </span>
              <MacroPills p={dayData.totalProtein} c={dayData.totalCarbs} f={dayData.totalFat} />
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              {MEAL_SLOT_META.map(({ key, emoji, label }) => (
                <DietMealCard key={key} meal={dayData[key] as DietMeal} emoji={emoji} label={label} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AIDietPlanTab() {
  const [dietType, setDietType] = useState<DietPlanType>('protein')
  const [targetCalories, setTargetCalories] = useState(1800)
  const [cuisine, setCuisine] = useState('')
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>([])
  const [avoidInput, setAvoidInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<GeneratedDietPlan | null>(null)

  const addAvoid = (raw: string) => {
    const items = raw.split(',').map(s => s.trim()).filter(s => s.length > 0)
    setAvoidIngredients(prev => [...new Set([...prev, ...items])])
    setAvoidInput('')
  }

  const handleAvoidKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (avoidInput.trim()) addAvoid(avoidInput)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setPlan(null)
    try {
      const res = await fetch('/pantrychef/api/diet-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dietType, targetCalories, cuisine, avoidIngredients }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setPlan(data.plan)
      toast.success('Your 7-day plan is ready!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!plan) return
    const lines: string[] = [`${plan.name}`, `Avg ${plan.weeklyAvgCalories} kcal/day`, '', plan.description, '']
    plan.days.forEach(day => {
      lines.push(`=== ${day.day} (${day.totalCalories} kcal | P:${day.totalProtein}g C:${day.totalCarbs}g F:${day.totalFat}g) ===`)
      MEAL_SLOT_META.forEach(({ key, label }) => {
        const meal = day[key] as DietMeal
        lines.push(`  ${label}: ${meal.name} — ${meal.calories} kcal`)
        meal.ingredients.forEach(ing => lines.push(`    • ${ing.name}: ${ing.amount} (${ing.grams}g)`))
      })
      lines.push('')
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'diet-plan.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Config card */}
      <div className="card p-6 space-y-5">
        <div>
          <h2 className="font-bold text-gray-900 text-base">Choose your diet type</h2>
          <p className="text-sm text-gray-500 mt-0.5">AI will generate a personalised 7-day plan with ingredient weights and calorie counts</p>
        </div>

        {/* Diet type selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DIET_TYPES.map(({ value, label, icon, desc, color }) => (
            <button
              key={value}
              onClick={() => setDietType(value)}
              className={cn(
                'flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all',
                dietType === value ? color : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              )}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {icon} {label}
              </div>
              <p className={cn('text-xs', dietType === value ? 'opacity-80' : 'text-gray-400')}>{desc}</p>
            </button>
          ))}
        </div>

        {/* Calorie target */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Daily calorie target</label>
          <div className="flex flex-wrap gap-2">
            {CALORIE_TARGETS.map(cal => (
              <button
                key={cal}
                onClick={() => setTargetCalories(cal)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                  targetCalories === cal
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                )}
              >
                {cal} kcal
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine preference */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Cuisine style <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map(({ value, label, emoji }) => (
              <button
                key={value || 'any'}
                onClick={() => setCuisine(value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                  cuisine === value
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                )}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients to avoid */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Ingredients to avoid <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-gray-200 bg-white min-h-[44px] focus-within:border-orange-400 transition-colors">
            {avoidIngredients.map(item => (
              <span key={item} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium">
                {item}
                <button onClick={() => setAvoidIngredients(prev => prev.filter(i => i !== item))} className="hover:text-red-900 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              value={avoidInput}
              onChange={e => setAvoidInput(e.target.value)}
              onKeyDown={handleAvoidKeyDown}
              onBlur={() => { if (avoidInput.trim()) addAvoid(avoidInput) }}
              placeholder={avoidIngredients.length === 0 ? 'e.g. peanuts, shellfish, dairy — press Enter to add' : 'Add more…'}
              className="flex-1 min-w-32 text-xs outline-none bg-transparent text-gray-700 placeholder-gray-400"
            />
          </div>
          <p className="text-xs text-gray-400">Press Enter or comma to add each item</p>
        </div>

        <motion.button
          onClick={handleGenerate}
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-2xl font-bold text-base btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <><RefreshCw className="w-5 h-5 animate-spin" /> Generating your plan…</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Generate My 7-Day Plan</>
          )}
        </motion.button>

        {loading && (
          <p className="text-center text-xs text-gray-400">This takes 20–30 seconds — crafting 28 meals just for you</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Generated plan */}
      {plan && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Plan header */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-display">{plan.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="flex items-center gap-1 text-sm font-semibold text-orange-600">
                    <Flame className="w-4 h-4" />{plan.weeklyAvgCalories} kcal/day avg
                  </span>
                </div>
              </div>
              <button onClick={handleExport}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>

            {/* Weekly macro overview */}
            {(() => {
              const avg = (fn: (d: DietDay) => number) => Math.round(plan.days.reduce((s, d) => s + fn(d), 0) / plan.days.length)
              return (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Avg Protein', value: avg(d => d.totalProtein), unit: 'g', color: 'bg-blue-50 text-blue-700' },
                    { label: 'Avg Carbs', value: avg(d => d.totalCarbs), unit: 'g', color: 'bg-amber-50 text-amber-700' },
                    { label: 'Avg Fat', value: avg(d => d.totalFat), unit: 'g', color: 'bg-purple-50 text-purple-700' },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label} className={cn('rounded-xl p-3 text-center', color)}>
                      <p className="text-xl font-bold">{value}{unit}</p>
                      <p className="text-xs opacity-75">{label}</p>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Day cards */}
          <div className="space-y-3">
            {plan.days.map((day, i) => (
              <DietDayCard key={day.day} dayData={day} defaultOpen={i === 0} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlannerPage() {
  const { savedRecipes } = useAppStore()
  const [activeTab, setActiveTab] = useState<'manual' | 'ai-plan'>('manual')
  const [plan, setPlan] = useState<Record<string, Partial<Record<typeof MEAL_SLOTS[number], Recipe>>>>(
    () => Object.fromEntries(DAYS.map(d => [d, {}]))
  )
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const addMeal = (day: string, slot: typeof MEAL_SLOTS[number], recipe: Recipe) =>
    setPlan(prev => ({ ...prev, [day]: { ...prev[day], [slot]: recipe } }))

  const removeMeal = (day: string, slot: typeof MEAL_SLOTS[number]) =>
    setPlan(prev => { const d = { ...prev[day] }; delete d[slot]; return { ...prev, [day]: d } })

  const totalMeals = Object.values(plan).reduce((acc, d) => acc + Object.values(d).filter(Boolean).length, 0)
  const totalCalories = Object.values(plan).reduce(
    (acc, d) => acc + Object.values(d).reduce((a, r) => a + (r?.nutrition.calories || 0), 0), 0
  )

  const shoppingList = () => {
    const ingredients = new Set<string>()
    Object.values(plan).forEach(d => Object.values(d).forEach(r => r?.missingIngredients.forEach(i => ingredients.add(i))))
    const list = [...ingredients]
    if (list.length === 0) toast.success('You have everything you need!')
    else toast.success(`Need: ${list.slice(0, 3).join(', ')}${list.length > 3 ? '...' : ''}`)
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display flex items-center gap-2">
              <Calendar className="w-6 h-6 text-orange-500" />
              Meal Planner
            </h1>
            <p className="text-gray-500 text-sm mt-1">Plan manually or let AI build a complete diet plan for you</p>
          </div>
          {activeTab === 'manual' && totalMeals > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={shoppingList} className="btn-secondary text-sm px-4 py-2">
                <ShoppingCart className="w-4 h-4" /> Shopping List
              </button>
              <Link href="/dashboard" className="btn-primary text-sm px-4 py-2">
                <Sparkles className="w-4 h-4" /> Add Recipes
              </Link>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit mb-6">
          {[
            { key: 'manual', label: 'Manual Planner', icon: <Calendar className="w-4 h-4" /> },
            { key: 'ai-plan', label: 'AI Diet Plan', icon: <Sparkles className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Manual planner tab */}
        {activeTab === 'manual' && (
          <>
            {savedRecipes.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <ChefHat className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Save recipes first</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Generate recipes in the dashboard and save your favourites.{' '}
                    <Link href="/dashboard" className="underline">Go to Dashboard →</Link>
                  </p>
                </div>
              </motion.div>
            )}

            <div className="overflow-x-auto pb-4">
              <div className="grid grid-cols-7 gap-3 min-w-[900px]">
                {DAYS.map(day => (
                  <div key={day} className="space-y-2">
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm">{day.slice(0, 3)}</p>
                      <p className="text-xs text-gray-400">{day}</p>
                    </div>
                    {MEAL_SLOTS.map(slot => (
                      <MealSlot key={slot} day={day} slot={slot} recipe={plan[day][slot]}
                        savedRecipes={savedRecipes} onAdd={addMeal} onRemove={removeMeal} onView={setSelectedRecipe} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {totalMeals > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 card p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-orange-500" /> Week Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Meals planned', value: totalMeals, color: 'bg-orange-50 text-orange-600' },
                    { label: 'Avg daily kcal', value: Math.round(totalCalories / 7), color: 'bg-blue-50 text-blue-600' },
                    { label: 'Slots remaining', value: 7 * 4 - totalMeals, color: 'bg-green-50 text-green-600' },
                    {
                      label: 'Cuisines',
                      value: [...new Set(Object.values(plan).flatMap(d => Object.values(d).map(r => r?.cuisine).filter(Boolean)))].length,
                      color: 'bg-purple-50 text-purple-600',
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={cn('text-center p-3 rounded-xl', color)}>
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* AI Diet Plan tab */}
        {activeTab === 'ai-plan' && <AIDietPlanTab />}
      </div>

      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetail recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
