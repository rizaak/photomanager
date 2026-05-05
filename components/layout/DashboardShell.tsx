'use client'

import { usePathname } from 'next/navigation'
import { DashboardNav } from './DashboardNav'

const GALLERY_RE = /^\/dashboard\/gallery\/[^/]+/

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const isGallery = GALLERY_RE.test(pathname)

  if (isGallery) {
    // Gallery layout provides its own sidebar + wrapper
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <DashboardNav />
      <main className="flex-1 ml-60 min-h-screen">{children}</main>
    </div>
  )
}
