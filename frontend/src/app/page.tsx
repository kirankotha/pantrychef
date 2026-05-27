'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ChefHat, Sparkles, Clock, Leaf, ArrowRight,
  Star, Users, Zap, Shield, BarChart3, CheckCircle2
} from 'lucide-react'

const FEATURES = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'AI Recipe Generation',
    desc: 'Powered by GPT-4, generates creative recipes from your exact pantry ingredients.',
    color: 'orange',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Full Nutrition Breakdown',
    desc: 'Get calories, macros, and micronutrients for every recipe and serving.',
    color: 'blue',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Time-Based Filtering',
    desc: 'Filter recipes by available time — from 15-minute dinners to weekend feasts.',
    color: 'green',
  },
  {
    icon: <Leaf className="w-5 h-5" />,
    title: '10 Dietary Modes',
    desc: 'Keto, vegan, high-protein, gluten-free, Mediterranean and more.',
    color: 'emerald',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Meal Planning',
    desc: 'Plan your entire week of meals and generate a consolidated shopping list.',
    color: 'purple',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Smart Substitutions',
    desc: 'AI suggests ingredient swaps when you\'re missing something.',
    color: 'amber',
  },
]

const CUISINES = [
  { flag: '🇮🇳', name: 'Indian' },
  { flag: '🇮🇹', name: 'Italian' },
  { flag: '🇲🇽', name: 'Mexican' },
  { flag: '🇨🇳', name: 'Chinese' },
  { flag: '🇯🇵', name: 'Japanese' },
  { flag: '🇰🇷', name: 'Korean' },
  { flag: '🇹🇭', name: 'Thai' },
  { flag: '🌊', name: 'Mediterranean' },
]

const STATS = [
  { value: '11', label: 'Cuisines', icon: <ChefHat className="w-5 h-5" /> },
  { value: '10', label: 'Dietary modes', icon: <Leaf className="w-5 h-5" /> },
  { value: '<30s', label: 'Generation time', icon: <Zap className="w-5 h-5" /> },
  { value: '100%', label: 'Privacy-first', icon: <Shield className="w-5 h-5" /> },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Add Your Ingredients',
    desc: 'Type what\'s in your fridge and pantry. Our autocomplete makes it fast.',
    emoji: '🥘',
  },
  {
    step: '02',
    title: 'Set Your Preferences',
    desc: 'Choose cuisine, dietary needs, cooking time, and how many you\'re cooking for.',
    emoji: '⚙️',
  },
  {
    step: '03',
    title: 'Get AI Recipes',
    desc: 'Receive 3-4 personalized recipes with full instructions and nutrition info.',
    emoji: '✨',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Nav */}
      <nav className="glass border-b border-white/40 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-brand">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg font-display">
              Pantry<span className="gradient-text">Chef</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden sm:block btn-ghost text-sm">Dashboard</Link>
            <Link href="/dashboard" className="btn-primary text-sm px-5 py-2">
              <Sparkles className="w-4 h-4" />
              Try Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-pattern pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Recipe Generation
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-gray-900 leading-[1.1] tracking-tight">
              Cook Amazing Meals{' '}
              <span className="gradient-text">From What You Have</span>
            </h1>

            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Add the ingredients in your kitchen. Get personalized recipes with step-by-step
              instructions, nutrition breakdowns, and pro chef tips — in seconds.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard" className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
                <Sparkles className="w-5 h-5" />
                Generate My First Recipe
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/saved" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
                View Example Recipes
              </Link>
            </div>

            <p className="mt-4 text-sm text-gray-400">
              No account required to generate recipes • Requires OpenAI API key
            </p>
          </motion.div>

          {/* Floating ingredient tags */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-16 flex flex-wrap justify-center gap-3"
          >
            {['chicken', 'garlic', 'tomatoes', 'pasta', 'onion', 'olive oil', 'eggs', 'rice', 'lemon', 'ginger'].map((ing, i) => (
              <motion.span
                key={ing}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="tag text-sm"
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                {ing}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white"
            >
              <Sparkles className="w-3.5 h-3.5" />
              = amazing recipes
            </motion.span>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon }) => (
            <div key={label} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-2 text-orange-500">
                {icon}
              </div>
              <div className="text-3xl font-bold font-display gradient-text">{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-heading">How it works</h2>
            <p className="text-gray-500 mt-3">Three simple steps to your next amazing meal</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc, emoji }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="text-5xl mb-4">{emoji}</div>
                <div className="text-xs font-bold text-orange-400 tracking-widest mb-2">STEP {step}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute top-8 -right-4 text-gray-200 text-2xl">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-heading">Everything you need to cook smarter</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              PantryChef combines AI intelligence with real culinary knowledge
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-6 hover:shadow-card-hover transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center text-${color}-500 mb-4`}>
                  {icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cuisines */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="section-heading mb-4">11 world cuisines</h2>
          <p className="text-gray-500 mb-10">From Indian curries to Japanese ramen, Italian pasta to Korean BBQ</p>
          <div className="flex flex-wrap justify-center gap-4">
            {CUISINES.map(({ flag, name }) => (
              <Link key={name} href="/dashboard" className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 transition-all hover:-translate-y-0.5 shadow-card">
                <span className="text-2xl">{flag}</span>
                <span className="font-medium text-gray-700">{name}</span>
              </Link>
            ))}
            <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-orange-200 bg-orange-50 transition-all hover:-translate-y-0.5 shadow-card">
              <span className="text-2xl">✨</span>
              <span className="font-medium text-orange-700">+ Fusion</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-10 shadow-brand-lg">
            <ChefHat className="w-12 h-12 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white font-display mb-3">
              Ready to cook smarter?
            </h2>
            <p className="text-orange-100 mb-8">
              Add your ingredients and get personalized AI recipes in under 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-orange-600 bg-white hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 shadow-lg">
                <Sparkles className="w-5 h-5" />
                Start Cooking Free
              </Link>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-orange-200 text-sm">
              {['No signup needed', 'AI-powered', 'Privacy-first'].map(item => (
                <span key={item} className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {item}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-gray-700">PantryChef</span>
          </div>
          <p className="text-sm text-gray-400">AI-powered recipe generation for smarter cooking.</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-orange-500 transition-colors">Dashboard</Link>
            <Link href="/saved" className="hover:text-orange-500 transition-colors">Saved</Link>
            <Link href="/planner" className="hover:text-orange-500 transition-colors">Planner</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
