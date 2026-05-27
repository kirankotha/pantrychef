import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'PantryChef — Cook Amazing Meals From What You Have',
    template: '%s | PantryChef',
  },
  description:
    'AI-powered recipe generator that creates personalized meal ideas from the ingredients in your kitchen. Get step-by-step instructions, nutrition info, and chef tips instantly.',
  keywords: ['recipe generator', 'AI cooking', 'pantry recipes', 'meal planning', 'nutrition'],
  authors: [{ name: 'PantryChef' }],
  creator: 'PantryChef',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pantrychef.app',
    title: 'PantryChef — AI Recipe Generator',
    description: 'Turn your pantry ingredients into amazing meals with AI.',
    siteName: 'PantryChef',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PantryChef — AI Recipe Generator',
    description: 'Turn your pantry ingredients into amazing meals with AI.',
  },
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-icon.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f97316',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
