'use client'

import { UploadZone } from '@/components/upload/UploadZone'

interface GalleryUploadClientProps {
  galleryId:    string
  galleryTitle: string
}

export function GalleryUploadClient({ galleryId, galleryTitle }: GalleryUploadClientProps) {
  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-8">
        <h2 className="font-serif text-2xl text-stone-900 mb-1">Upload Photos</h2>
        <p className="text-sm font-sans text-stone-400">
          {galleryTitle} — photos are processed in the background.
        </p>
      </div>
      <UploadZone galleryId={galleryId} />
    </div>
  )
}
