'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { UploadZone } from '@/components/upload/UploadZone'

interface GalleryUploadClientProps {
  galleryId: string
  galleryTitle: string
}

export function GalleryUploadClient({ galleryId, galleryTitle }: GalleryUploadClientProps) {
  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/gallery/${galleryId}`}
            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-sm font-sans transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            {galleryTitle}
          </Link>
          <span className="text-stone-200">/</span>
          <span className="text-sm font-sans text-stone-700 font-medium">Upload Photos</span>
        </div>
      </header>

      {/* ── Upload area ───────────────────────────────────────────────────── */}
      <div className="flex-1 px-10 py-12 max-w-3xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-2xl text-stone-900 mb-1">{galleryTitle}</h1>
          <p className="text-sm text-stone-400 font-sans">
            Photos are processed in the background. You can close this page once uploads are complete.
          </p>
        </div>

        <UploadZone galleryId={galleryId} />

        <div className="mt-8 flex justify-end">
          <Link
            href={`/dashboard/gallery/${galleryId}`}
            className="text-sm font-sans text-stone-500 hover:text-stone-800 transition-colors"
          >
            Done — back to gallery
          </Link>
        </div>
      </div>

    </div>
  )
}
