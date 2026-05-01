'use client'

import { Heart } from 'lucide-react'
import type { Photo } from '@/lib/types'

interface PhotoCardProps {
  photo: Photo
  index: number
  favorited: boolean
  hasComment: boolean
  onOpen: (index: number) => void
  onFavoriteToggle?: (id: string) => void
  /** Override aspect ratio, e.g. "16/7" or "1/1". Uses natural photo ratio when omitted. */
  aspectRatio?: string
}

export function PhotoCard({ photo, index, favorited, hasComment, onOpen, onFavoriteToggle, aspectRatio: aspectRatioProp }: PhotoCardProps) {
  const naturalRatio = photo.height / photo.width
  const paddingBottom = (() => {
    if (!aspectRatioProp) return `${Math.min(Math.max(naturalRatio * 100, 66), 150)}%`
    const [h, w] = aspectRatioProp.split('/').map(Number)
    return `${(h / w) * 100}%`
  })()

  return (
    <div
      className="relative group overflow-hidden rounded"
      style={{
        boxShadow: favorited
          ? '0 0 28px rgba(201,169,110,0.16), 0 4px 20px rgba(0,0,0,0.44)'
          : '0 2px 12px rgba(0,0,0,0.32)',
        transition: 'box-shadow 500ms ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Photo — tap always opens modal */}
      <div
        className="relative w-full cursor-zoom-in"
        style={{ paddingBottom }}
        onClick={() => onOpen(index)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className={`absolute inset-0 ${photo.placeholderColor} brightness-[1.02] group-hover:brightness-[1.09]`}
          style={{ transition: 'filter 280ms ease' }}
        />

        {photo.thumbnailUrl && (
          <img
            src={photo.thumbnailUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            style={{
              transition: 'opacity 400ms ease',
              pointerEvents: 'none',
              WebkitUserDrag: 'none',
            } as React.CSSProperties}
            ref={(img) => { if (img?.complete) img.style.opacity = '1' }}
            onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 pointer-events-none transition-colors duration-300 bg-transparent group-hover:bg-black/[0.18]" />

        {/* Warm wash when favorited */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: favorited ? 1 : 0,
            transition: 'opacity 900ms ease',
            background: 'linear-gradient(to top, rgba(201,169,110,0.08) 0%, rgba(201,169,110,0.02) 60%, transparent 100%)',
          }}
        />
      </div>

      {/* Bottom bar: heart + comment dot */}
      {onFavoriteToggle && (
        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
          <button
            className={`
              pointer-events-auto w-6 h-6 flex items-center justify-center
              transition-all duration-200
              ${favorited
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-60'
              }
            `}
            onClick={(e) => { e.stopPropagation(); onFavoriteToggle(photo.id) }}
            aria-label={favorited ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Heart
              size={13}
              strokeWidth={1.5}
              style={{
                fill:       favorited ? '#C9A96E' : 'transparent',
                color:      favorited ? '#C9A96E' : 'rgba(255,255,255,0.55)',
                transition: 'fill 300ms ease, color 300ms ease',
              }}
            />
          </button>

          {/* Comment dot — visible when photo has a note */}
          {hasComment && (
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(201,169,110,0.65)' }}
            />
          )}
        </div>
      )}
    </div>
  )
}
