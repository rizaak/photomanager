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
      {/* Masonry grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-2">
        {photos.map((photo, i) => (
          <div key={photo.id} className="mb-2 break-inside-avoid">
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

      {/* Modal */}
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
