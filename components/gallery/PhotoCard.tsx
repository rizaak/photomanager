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
  // Clamp to realistic photography proportions
  const paddingBottom = `${Math.min(Math.max(aspectRatio * 100, 66), 150)}%`

  return (
    <div
      className="relative group overflow-hidden"
      style={{
        boxShadow: photo.selected
          ? '0 0 0 2px #C9A96E, 0 4px 20px rgba(0,0,0,0.55)'
          : '0 4px 20px rgba(0,0,0,0.55)',
      }}
    >
      {/* Photo (click → open modal) */}
      <div
        className="relative w-full cursor-pointer"
        style={{ paddingBottom }}
        onClick={() => onOpen(index)}
      >
        {/* Base photo — brightened slightly so it feels alive against the dark bg */}
        <div
          className={`absolute inset-0 ${photo.placeholderColor} transition-[filter] duration-300 brightness-[1.06] group-hover:brightness-[1.12]`}
        />

        {/* Subtle selected overlay */}
        {photo.selected && (
          <div className="absolute inset-0 bg-accent/8" />
        )}

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-white/8 font-serif text-xl rotate-[-30deg] tracking-[0.25em]">
            FRAME
          </span>
        </div>
      </div>

      {/* Select checkbox — only when selectable */}
      {selectable && (
        <button
          className={`absolute top-2.5 right-2.5 z-20 w-6 h-6 flex items-center justify-center border-2 transition-all duration-150 ${
            photo.selected
              ? 'bg-accent border-accent opacity-100 scale-100'
              : 'bg-stone-950/30 border-white/50 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 backdrop-blur-sm'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect(photo.id)
          }}
          aria-label={photo.selected ? 'Deselect photo' : 'Select photo'}
        >
          {photo.selected && <Check size={12} strokeWidth={2.5} className="text-stone-950" />}
        </button>
      )}
    </div>
  )
}
