'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface NavbarProps {
  theme?: 'light' | 'dark'
}

export function Navbar({ theme = 'dark' }: NavbarProps) {
  const isDark = theme === 'dark'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24)
    }
    // Check on mount in case page loads mid-scroll
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500"
      style={
        isDark
          ? {
              backgroundColor: scrolled ? 'rgba(10,8,7,0.88)' : 'transparent',
              backdropFilter: scrolled ? 'blur(20px)' : 'none',
              WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
              borderColor: scrolled ? 'rgba(255,255,255,0.06)' : 'transparent',
            }
          : {
              backgroundColor: 'rgba(250,250,249,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderColor: '#e7e5e4',
            }
      }
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className={`font-serif text-xl tracking-wide ${isDark ? 'text-white' : 'text-stone-900'}`}
        >
          Frame
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#how-it-works"
            className={`text-sm font-sans transition-colors ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            How it works
          </a>
          <a
            href="#pricing"
            className={`text-sm font-sans transition-colors ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className={`text-sm font-sans transition-colors ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Log in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-5 py-2.5 bg-accent text-stone-950 text-sm font-sans font-medium hover:bg-accent-hover transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
