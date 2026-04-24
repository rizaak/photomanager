'use client'

import { Check } from 'lucide-react'
import type { Photo } from '@/lib/types'

interface PhotoCardProps {
  photo: Photo
  onSelect?: (id: string) => void
  selectable?: boolean
}

export function PhotoCard({ photo, onSelect, selectable = false }: PhotoCardProps) {
  const aspectRatio = photo.height / photo.width
  const paddingBottom = `${Math.min(Math.max(aspectRatio * 100, 100), 140)}%`

  return (
    <div
      className={`relative overflow-hidden group ${selectable ? 'cursor-pointer' : ''}`}
      onClick={() => selectable && onSelect?.(photo.id)}
    >
      {/* Photo placeholder */}
      <div className="relative w-full" style={{ paddingBottom }}>
        <div className={`absolute inset-0 ${photo.placeholderColor} transition-all duration-300 group-hover:brightness-95`} />

        {/* Selected overlay */}
        {photo.selected && (
          <div className="absolute inset-0 bg-stone-950/20" />
        )}

        {/* Watermark simulation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white/10 font-serif text-2xl rotate-[-30deg] select-none tracking-widest">
            FRAME
          </span>
        </div>

        {/* Selection indicator */}
        {selectable && (
          <div
            className={`absolute top-3 right-3 w-6 h-6 border-2 flex items-center justify-center transition-all duration-150 ${
              photo.selected
                ? 'bg-accent border-accent'
                : 'bg-white/20 border-white/60 opacity-0 group-hover:opacity-100'
            }`}
          >
            {photo.selected && <Check size={13} strokeWidth={2.5} className="text-stone-950" />}
          </div>
        )}
      </div>
    </div>
  )
}
