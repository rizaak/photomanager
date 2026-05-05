'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, Settings, LogOut } from 'lucide-react'
import { useUser } from '@auth0/nextjs-auth0/client'

interface GalleryNavProps {
  galleryId:     string
  galleryTitle:  string
  galleryStatus: string
}

const NAV: { label: string; segment: string | null }[] = [
  { label: 'Photos',   segment: null       },
  { label: 'Upload',   segment: 'upload'   },
  { label: 'Clients',  segment: 'clients'  },
  { label: 'Activity', segment: 'activity' },
  { label: 'Settings', segment: 'settings' },
]

const STATUS_COLOR: Record<string, string> = {
  draft:    'text-stone-500',
  active:   'text-emerald-400',
  archived: 'text-stone-600',
}

export function GalleryNav({ galleryId, galleryTitle, galleryStatus }: GalleryNavProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const base      = `/dashboard/gallery/${galleryId}`

  const displayName = user?.name ?? user?.email ?? ''
  const initial     = displayName.charAt(0).toUpperCase()

  function href(segment: string | null) {
    return segment ? `${base}/${segment}` : base
  }

  function isActive(segment: string | null) {
    const target = href(segment)
    return segment === null ? pathname === target : pathname.startsWith(target)
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-stone-950 flex flex-col z-40 border-r border-stone-900">

      {/* Logo + back to galleries */}
      <div className="h-11 flex items-center justify-between px-5 border-b border-stone-900 shrink-0">
        <Link href="/" className="font-serif text-lg text-white tracking-wide">
          Frame
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-[11px] font-sans text-stone-600 hover:text-stone-300 transition-colors"
        >
          <ArrowLeft size={11} strokeWidth={1.5} />
          Galleries
        </Link>
      </div>

      {/* Gallery identity */}
      <div className="px-5 py-4 border-b border-stone-900 shrink-0">
        <p className="text-sm font-sans text-stone-100 font-medium leading-snug line-clamp-2">
          {galleryTitle}
        </p>
        <p className={`text-[11px] font-sans mt-1 capitalize ${STATUS_COLOR[galleryStatus] ?? 'text-stone-500'}`}>
          {galleryStatus}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV.map(({ label, segment }) => {
            const active = isActive(segment)
            return (
              <li key={label}>
                <Link
                  href={href(segment)}
                  className={`flex items-center px-3 py-2 text-sm font-sans rounded-sm transition-colors ${
                    active
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-500 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer: user + global actions */}
      <div className="border-t border-stone-900 p-4 shrink-0">
        {user && (
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 bg-accent flex items-center justify-center text-stone-950 text-xs font-sans font-medium shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-stone-200 font-sans truncate leading-snug">{displayName}</p>
              {user.name && user.email && (
                <p className="text-[11px] text-stone-600 font-sans truncate">{user.email}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-1.5 text-[11px] font-sans text-stone-600 hover:text-stone-300 transition-colors"
          >
            <Settings size={12} strokeWidth={1.5} />
            Settings
          </Link>
          <a
            href="/api/auth/logout"
            className="flex items-center gap-1.5 text-[11px] font-sans text-stone-600 hover:text-stone-300 transition-colors"
          >
            <LogOut size={12} strokeWidth={1.5} />
            Sign out
          </a>
        </div>
      </div>

    </aside>
  )
}
