'use client'

import { Check } from 'lucide-react'
import type { Photo } from '@/lib/types'

interface PhotoCardProps {
  photo: Photo
  index: number
  onOpen: (index: number) => void
  onToggleSelect: (id: string) => void
  selectable: boolean
}

export function PhotoCard({ photo, index, onOpen, onToggleSelect, selectable }: PhotoCardProps) {
  const aspectRatio = photo.height / photo.width
  const paddingBottom = `${Math.min(Math.max(aspectRatio * 100, 66), 150)}%`

  return (
    <div
      className="relative group overflow-hidden rounded"
      style={{
        boxShadow: photo.selected
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
      >
        <div
          className={`absolute inset-0 ${photo.placeholderColor} brightness-[1.02] group-hover:brightness-[1.09]`}
          style={{ transition: 'filter 280ms ease' }}
        />

        {/* Real thumbnail — fades in once loaded, placeholder shows behind it */}
        {photo.thumbnailUrl && (
          <img
            src={photo.thumbnailUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            style={{ transition: 'opacity 400ms ease' }}
            onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
          />
        )}

        {/* Hover overlay — universal signal that the image is interactive */}
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-300 bg-transparent group-hover:bg-black/[0.18]"
        />

        {/* Warm wash fades in on select */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: photo.selected ? 1 : 0,
            transition: 'opacity 900ms ease',
            background:
              'linear-gradient(to top, rgba(201,169,110,0.08) 0%, rgba(201,169,110,0.02) 60%, transparent 100%)',
          }}
        />
      </div>

      {/* Select button — revealed on hover (desktop) or always faintly present (touch) */}
      {selectable && (
        <button
          className={`
            group/btn
            absolute top-2 right-2 z-20 w-7 h-7 rounded-full
            flex items-center justify-center
            transition-all duration-200
            ${photo.selected
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-70'
            }
          `}
          style={{
            backgroundColor: photo.selected ? '#C9A96E' : 'rgba(8,7,6,0.52)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: photo.selected
              ? '0 0 10px rgba(201,169,110,0.30)'
              : '0 0 0 1px rgba(255,255,255,0.30)',
          }}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(photo.id) }}
          aria-label={photo.selected ? 'Deselect photo' : 'Select photo'}
        >
          <Check
            size={10}
            strokeWidth={2.5}
            className={`text-stone-950 ${
              photo.selected
                ? ''
                : 'opacity-0 group-hover/btn:opacity-40 scale-[0.2] group-hover/btn:scale-75'
            }`}
            style={
              photo.selected
                ? {
                    animation: 'checkPop 480ms cubic-bezier(0.34,1.56,0.64,1) forwards',
                  }
                : {
                    transition: 'opacity 160ms ease, transform 160ms ease',
                  }
            }
          />
        </button>
      )}
    </div>
  )
}
