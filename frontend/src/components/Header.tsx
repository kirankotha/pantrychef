'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChefHat, BookOpen, Calendar, User, Sparkles, LogOut, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard', label: 'Generator', icon: Sparkles },
  { href: '/saved', label: 'Saved', icon: BookOpen },
  { href: '/planner', label: 'Meal Plan', icon: Calendar },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth } = useAppStore()

  const handleLogout = async () => {
    try {
      await fetch('/pantrychef/api/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    clearAuth()
    toast.success('Signed out')
    router.push('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-40 glass border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-shadow">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg font-display text-gray-900">
              Pantry<span className="gradient-text">Chef</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'text-orange-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-orange-50 rounded-lg -z-10 border border-orange-100"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user.name?.split(' ')[0] ?? user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <LogIn className="w-4 h-4" />
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary text-sm px-5 py-2">
                  <Sparkles className="w-4 h-4" />
                  Sign up free
                </Link>
              </>
            )}
          </div>

          {/* Mobile nav */}
          <nav className="flex md:hidden items-center gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'p-2.5 rounded-lg transition-colors',
                    active ? 'text-orange-600 bg-orange-50' : 'text-gray-500'
                  )}
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              )
            })}
            {user ? (
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-lg text-gray-500 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <Link href="/login" className="p-2.5 rounded-lg text-gray-500 transition-colors" aria-label="Sign in">
                <LogIn className="w-5 h-5" />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
