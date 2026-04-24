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
    <div className="relative group overflow-hidden">
      {/* Gold border when selected */}
      <div
        className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-200 ${
          photo.selected ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ boxShadow: 'inset 0 0 0 2px #C9A96E' }}
      />

      {/* Photo (click → open modal) */}
      <div
        className="relative w-full cursor-pointer"
        style={{ paddingBottom }}
        onClick={() => onOpen(index)}
      >
        <div
          className={`absolute inset-0 ${photo.placeholderColor} transition-[filter] duration-300 group-hover:brightness-90`}
        />

        {/* Subtle selected dim */}
        {photo.selected && (
          <div className="absolute inset-0 bg-stone-950/10" />
        )}

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-white/8 font-serif text-xl rotate-[-30deg] tracking-[0.25em]">
            FRAME
          </span>
        </div>

        {/* Hover overlay — shows on group hover */}
        <div className="absolute inset-0 bg-stone-950/0 group-hover:bg-stone-950/10 transition-colors duration-300" />
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
