'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Share2, Check, AlertTriangle } from 'lucide-react'

interface GalleryHeaderProps {
  galleryId:     string
  galleryStatus: string   // 'draft' | 'active' | 'archived'
  shareToken:    string
}

export function GalleryHeader({ galleryId, galleryStatus, shareToken }: GalleryHeaderProps) {
  const [copied, setCopied] = useState(false)

  const isShareable = galleryStatus === 'active'

  function copyShare() {
    const url = `${window.location.origin}/gallery/${shareToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  return (
    <header className="sticky top-0 z-30 h-11 flex items-center justify-between px-6 bg-white border-b border-stone-100">

      {/* Status warning — only shown for non-active galleries */}
      {!isShareable && (
        <div className="flex items-center gap-1.5 text-[11px] font-sans text-amber-600">
          <AlertTriangle size={11} strokeWidth={1.5} />
          {galleryStatus === 'draft'    && 'Draft — not visible to clients'}
          {galleryStatus === 'archived' && 'Archived — not visible to clients'}
        </div>
      )}

      {isShareable && <span />}

      <div className="flex items-center gap-1">
        {/* Preview — goes through a protected dashboard route, not the public URL directly */}
        <Link
          href={`/dashboard/gallery/${galleryId}/preview`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors rounded-sm"
        >
          <Eye size={13} strokeWidth={1.5} />
          Preview
        </Link>

        {/* Share — copies the public client URL; only meaningful when gallery is active */}
        <button
          onClick={copyShare}
          title={isShareable ? undefined : 'Publish the gallery before sharing'}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans transition-colors rounded-sm ${
            isShareable
              ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
              : 'text-stone-300 cursor-default'
          }`}
        >
          {copied
            ? <Check          size={13} strokeWidth={1.5} className="text-emerald-500" />
            : <Share2         size={13} strokeWidth={1.5} />
          }
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>
    </header>
  )
}
