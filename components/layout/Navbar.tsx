import Link from 'next/link'

interface NavbarProps {
  theme?: 'light' | 'dark'
}

export function Navbar({ theme = 'dark' }: NavbarProps) {
  const isDark = theme === 'dark'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${
        isDark ? 'border-stone-900' : 'border-stone-200 bg-stone-50/95 backdrop-blur-sm'
      } border-b`}
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
            className={`text-sm font-sans ${isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'} transition-colors`}
          >
            How it works
          </a>
          <a
            href="#pricing"
            className={`text-sm font-sans ${isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'} transition-colors`}
          >
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className={`text-sm font-sans ${isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'} transition-colors`}
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
