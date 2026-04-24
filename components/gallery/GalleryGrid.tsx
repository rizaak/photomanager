'use client'

import { useState } from 'react'
import { PhotoCard } from './PhotoCard'
import { PhotoModal } from './PhotoModal'
import type { Photo } from '@/lib/types'

interface GalleryGridProps {
  photos: Photo[]
  selectable?: boolean
  onSelectionChange?: (selectedIds: string[]) => void
}

export function GalleryGrid({
  photos: initialPhotos,
  selectable = false,
  onSelectionChange,
}: GalleryGridProps) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  function handleToggleSelect(id: string) {
    const updated = photos.map((p) =>
      p.id === id ? { ...p, selected: !p.selected } : p,
    )
    setPhotos(updated)
    onSelectionChange?.(updated.filter((p) => p.selected).map((p) => p.id))
  }

  return (
    <>
      {/* 2 columns on mobile, 3 on desktop — larger images feel more editorial */}
      <div className="columns-2 lg:columns-3 gap-3 lg:gap-4">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className={`break-inside-avoid ${
              // Every 6th image gets extra space below — creates natural visual grouping
              (i + 1) % 6 === 0 ? 'mb-8 lg:mb-10' : 'mb-3 lg:mb-4'
            }`}
          >
            <PhotoCard
              photo={photo}
              index={i}
              onOpen={setModalIndex}
              onToggleSelect={handleToggleSelect}
              selectable={selectable}
            />
          </div>
        ))}
      </div>

      {modalIndex !== null && (
        <PhotoModal
          photos={photos}
          initialIndex={modalIndex}
          onClose={() => setModalIndex(null)}
          onToggleSelect={handleToggleSelect}
        />
      )}
    </>
  )
}
