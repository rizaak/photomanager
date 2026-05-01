'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Images, Settings, LogOut, AlertTriangle } from 'lucide-react'
import type { UsageData } from '@/src/modules/photographers/services/UsageService'

const navItems = [
  { href: '/dashboard',          label: 'Galleries', icon: Images   },
  { href: '/dashboard/settings', label: 'Settings',  icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user }  = useUser()
  const [usage, setUsage] = useState<UsageData | null>(null)

  useEffect(() => {
    fetch('/api/photographer/usage')
      .then((r) => r.ok ? r.json() : null)
      .then((data: UsageData | null) => { if (data) setUsage(data) })
      .catch(() => { /* non-critical — fail silently */ })
  }, [])

  const displayName = user?.name ?? user?.email ?? ''
  const initial     = displayName.charAt(0).toUpperCase()

  const storageExceeded = usage?.storage.exceeded ?? false
  const hasWarning      = usage?.storage.warning ?? false

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-stone-950 flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-stone-900">
        <Link href="/" className="font-serif text-xl text-white tracking-wide">
          Frame
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-sans transition-colors ${
                    isActive
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-500 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Storage usage */}
      {usage && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-stone-600 font-sans">Storage</span>
            <span className={`text-[11px] font-sans tabular-nums ${
              storageExceeded ? 'text-red-400' : hasWarning ? 'text-amber-400' : 'text-stone-600'
            }`}>
              {usage.storage.usedGB} / {usage.storage.limitGB} GB
            </span>
          </div>
          <div className="h-1 bg-stone-800 mb-2">
            <div
              className={`h-1 transition-all ${
                storageExceeded ? 'bg-red-500' : hasWarning ? 'bg-amber-500' : 'bg-accent'
              }`}
              style={{ width: `${Math.min(100, usage.storage.percent)}%` }}
            />
          </div>
          {(hasWarning || storageExceeded) && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-stone-900/60">
              <AlertTriangle size={11} strokeWidth={1.5} className="text-amber-500 shrink-0" />
              <span className="text-[11px] font-sans text-stone-500">
                {storageExceeded ? 'Storage full — uploads paused' : 'Approaching storage limit'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* User */}
      <div className="border-t border-stone-900 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-accent flex items-center justify-center text-stone-950 text-xs font-sans font-medium">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-stone-200 font-sans truncate">{displayName}</p>
            <p className="text-xs text-stone-600 font-sans truncate">{user?.email}</p>
          </div>
        </div>

        <a
          href="/api/auth/logout"
          className="flex items-center gap-2 text-xs text-stone-600 hover:text-stone-400 font-sans transition-colors w-full"
        >
          <LogOut size={13} strokeWidth={1.5} />
          Sign out
        </a>
      </div>
    </aside>
  )
}
