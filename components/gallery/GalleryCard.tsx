'use client'

import Link from 'next/link'
import { MoreHorizontal, ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { Gallery, GalleryStatus } from '@/lib/types'

export function GalleryCard({ gallery }: { gallery: Gallery }) {
  return (
    <Link
      href={`/dashboard/gallery/${gallery.id}`}
      className="group block bg-white border border-stone-200 hover:border-stone-300 transition-colors"
    >
      {/* Cover placeholder */}
      <div className={`${gallery.coverColor} h-44 w-full`} />

      {/* Info */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-serif text-base text-stone-900 truncate mb-0.5">{gallery.title}</h3>
            <p className="text-sm text-stone-400 font-sans truncate">{gallery.clientName}</p>
          </div>
          <button
            onClick={(e) => e.preventDefault()}
            className="text-stone-300 hover:text-stone-600 transition-colors shrink-0 mt-0.5"
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-400 font-sans">
            <ImageIcon size={12} strokeWidth={1.5} />
            {gallery.photoCount} photos
          </div>
          <Badge variant={gallery.status as GalleryStatus} />
        </div>

        {gallery.expiresAt && (
          <p className="text-[11px] text-stone-300 font-sans mt-3">
            Expires {gallery.expiresAt}
          </p>
        )}
      </div>
    </Link>
  )
}
