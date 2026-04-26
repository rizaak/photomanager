'use client'

import { useState } from 'react'
import { PhotoCard } from './PhotoCard'
import { PhotoModal } from './PhotoModal'
import type { Photo } from '@/lib/types'

interface GalleryGridProps {
  photos: Photo[]
  selectable?: boolean
  onSelectionChange?: (selectedIds: string[]) => void
  onPhotoToggle?: (photoId: string, selected: boolean) => void
}

export function GalleryGrid({
  photos: initialPhotos,
  selectable = false,
  onSelectionChange,
  onPhotoToggle,
}: GalleryGridProps) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  function handleToggleSelect(id: string) {
    const current    = photos.find((p) => p.id === id)
    const newSelected = !current?.selected
    const updated    = photos.map((p) => (p.id === id ? { ...p, selected: newSelected } : p))
    setPhotos(updated)
    onPhotoToggle?.(id, newSelected)
    onSelectionChange?.(updated.filter((p) => p.selected).map((p) => p.id))
  }

  return (
    <>
      <div className="columns-2 lg:columns-3 gap-2 lg:gap-2.5">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="break-inside-avoid mb-2 lg:mb-2.5"
            style={{
              animation: `photoReveal 800ms cubic-bezier(0.22,1,0.36,1) ${Math.min(i, 9) * 55}ms both`,
            }}
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
