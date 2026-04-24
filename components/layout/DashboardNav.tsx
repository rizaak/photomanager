'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Images, Upload, Settings, LogOut } from 'lucide-react'
import { mockPhotographer } from '@/lib/mock-data'

const navItems = [
  { href: '/dashboard', label: 'Galleries', icon: Images },
  { href: '/dashboard/upload', label: 'Upload', icon: Upload },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()

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

      {/* User */}
      <div className="border-t border-stone-900 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-accent flex items-center justify-center text-stone-950 text-xs font-sans font-medium">
            {mockPhotographer.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-stone-200 font-sans truncate">{mockPhotographer.name}</p>
            <p className="text-xs text-stone-600 font-sans truncate">{mockPhotographer.plan}</p>
          </div>
        </div>

        {/* Storage bar */}
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-stone-600 font-sans">Storage</span>
            <span className="text-[11px] text-stone-600 font-sans">
              {mockPhotographer.storageUsedGB} / {mockPhotographer.storageLimitGB} GB
            </span>
          </div>
          <div className="h-1 bg-stone-800">
            <div
              className="h-1 bg-accent"
              style={{ width: `${(mockPhotographer.storageUsedGB / mockPhotographer.storageLimitGB) * 100}%` }}
            />
          </div>
        </div>

        <button className="flex items-center gap-2 text-xs text-stone-600 hover:text-stone-400 font-sans transition-colors w-full">
          <LogOut size={13} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
