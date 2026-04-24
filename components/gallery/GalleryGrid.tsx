'use client'

import { useState } from 'react'
import { PhotoCard } from './PhotoCard'
import type { Photo } from '@/lib/types'

interface GalleryGridProps {
  photos: Photo[]
  selectable?: boolean
  onSelectionChange?: (selectedIds: string[]) => void
}

export function GalleryGrid({ photos: initialPhotos, selectable = false, onSelectionChange }: GalleryGridProps) {
  const [photos, setPhotos] = useState(initialPhotos)

  function handleSelect(id: string) {
    const updated = photos.map((p) =>
      p.id === id ? { ...p, selected: !p.selected } : p
    )
    setPhotos(updated)
    onSelectionChange?.(updated.filter((p) => p.selected).map((p) => p.id))
  }

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-1">
      {photos.map((photo) => (
        <div key={photo.id} className="mb-1 break-inside-avoid">
          <PhotoCard
            photo={photo}
            selectable={selectable}
            onSelect={handleSelect}
          />
        </div>
      ))}
    </div>
  )
}
