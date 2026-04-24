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
  // Selection mode: entered via long press; tap-to-select replaces tap-to-open
  const [selectionMode, setSelectionMode] = useState(false)

  function applyUpdate(updated: Photo[]) {
    setPhotos(updated)
    const selectedIds = updated.filter((p) => p.selected).map((p) => p.id)
    onSelectionChange?.(selectedIds)
    // Auto-exit selection mode once everything is deselected
    if (selectedIds.length === 0) setSelectionMode(false)
  }

  function handleToggleSelect(id: string) {
    applyUpdate(photos.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)))
  }

  // Long press: enter selection mode and immediately select the pressed photo
  function handleLongPress(id: string) {
    setSelectionMode(true)
    applyUpdate(
      photos.map((p) => (p.id === id ? { ...p, selected: true } : p)),
    )
  }

  return (
    <>
      <div className="columns-2 lg:columns-3 gap-3 lg:gap-4">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className={`break-inside-avoid ${
              (i + 1) % 6 === 0 ? 'mb-8 lg:mb-10' : 'mb-3 lg:mb-4'
            }`}
            style={{
              // Staggered entrance — each column cascades in, capped so late photos
              // don't wait too long. `both` fill mode holds opacity:0 during delay.
              animation: `photoReveal 600ms cubic-bezier(0.22,1,0.36,1) ${Math.min(i, 9) * 50}ms both`,
            }}
          >
            <PhotoCard
              photo={photo}
              index={i}
              onOpen={setModalIndex}
              onToggleSelect={handleToggleSelect}
              onLongPress={handleLongPress}
              selectable={selectable}
              selectionMode={selectionMode}
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
