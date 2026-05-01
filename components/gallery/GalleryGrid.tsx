'use client'

import { useState } from 'react'
import { PhotoCard } from './PhotoCard'
import { PhotoModal } from './PhotoModal'
import type { Photo } from '@/lib/types'

export type GalleryLayout = 'masonry' | 'editorial' | 'uniform'

interface GalleryGridProps {
  photos: Photo[]
  layout?: GalleryLayout
  favoritedIds?: Set<string>
  photoComments?: Map<string, { id: string; body: string }>
  allowComments?: boolean
  allowDownload?: boolean
  onFavoriteToggle?: (photoId: string) => void
  onAddComment?: (photoId: string, body: string) => Promise<void>
  onUpdateComment?: (commentId: string, body: string, photoId: string) => Promise<void>
  onDeleteComment?: (commentId: string, photoId: string) => Promise<void>
}

export function GalleryGrid({
  photos,
  layout = 'masonry',
  favoritedIds = new Set(),
  photoComments,
  allowComments,
  allowDownload,
  onFavoriteToggle,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: GalleryGridProps) {
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  return (
    <>
      {layout === 'masonry' && (
        <div className="columns-2 lg:columns-3 gap-2 lg:gap-2.5">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="break-inside-avoid mb-2 lg:mb-2.5"
              style={{ animation: `photoReveal 800ms cubic-bezier(0.22,1,0.36,1) ${Math.min(i, 9) * 55}ms both` }}
            >
              <PhotoCard
                photo={photo}
                index={i}
                favorited={favoritedIds.has(photo.id)}
                hasComment={photoComments?.has(photo.id) ?? false}
                onOpen={setModalIndex}
                onFavoriteToggle={onFavoriteToggle}
              />
            </div>
          ))}
        </div>
      )}

      {layout === 'editorial' && (
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className={i % 5 === 0 ? 'col-span-2' : ''}
              style={{ animation: `photoReveal 800ms cubic-bezier(0.22,1,0.36,1) ${Math.min(i, 9) * 55}ms both` }}
            >
              <PhotoCard
                photo={photo}
                index={i}
                favorited={favoritedIds.has(photo.id)}
                hasComment={photoComments?.has(photo.id) ?? false}
                aspectRatio={i % 5 === 0 ? '16/7' : '4/5'}
                onOpen={setModalIndex}
                onFavoriteToggle={onFavoriteToggle}
              />
            </div>
          ))}
        </div>
      )}

      {layout === 'uniform' && (
        <div className="grid grid-cols-3 gap-1 lg:gap-1.5">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              style={{ animation: `photoReveal 800ms cubic-bezier(0.22,1,0.36,1) ${Math.min(i, 9) * 55}ms both` }}
            >
              <PhotoCard
                photo={photo}
                index={i}
                favorited={favoritedIds.has(photo.id)}
                hasComment={photoComments?.has(photo.id) ?? false}
                aspectRatio="1/1"
                onOpen={setModalIndex}
                onFavoriteToggle={onFavoriteToggle}
              />
            </div>
          ))}
        </div>
      )}

      {modalIndex !== null && (
        <PhotoModal
          photos={photos}
          initialIndex={modalIndex}
          favoritedIds={favoritedIds}
          photoComments={photoComments}
          allowComments={allowComments}
          allowDownload={allowDownload}
          onClose={() => setModalIndex(null)}
          onFavoriteToggle={onFavoriteToggle}
          onAddComment={onAddComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
        />
      )}
    </>
  )
}

