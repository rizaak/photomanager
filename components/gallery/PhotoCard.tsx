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
      // hover:scale adds a 0.3% lift — subtle life without jumping
      className="relative group overflow-hidden rounded hover:scale-[1.003]"
      style={{
        transition: 'transform 300ms ease, box-shadow 350ms ease',
        // Softer shadow than before; selected swaps hard ring for a warm glow
        boxShadow: photo.selected
          ? '0 0 0 1px rgba(201,169,110,0.28), 0 0 20px rgba(201,169,110,0.11), 0 4px 16px rgba(0,0,0,0.4)'
          : '0 2px 12px rgba(0,0,0,0.32)',
      }}
    >
      {/* Photo — click opens modal */}
      <div
        className="relative w-full cursor-pointer"
        style={{ paddingBottom }}
        onClick={() => onOpen(index)}
      >
        <div
          className={`absolute inset-0 ${photo.placeholderColor} transition-[filter] duration-500 brightness-[1.05] group-hover:brightness-[1.11]`}
        />

        {/* Warm wash on select — cross-fades, never flickers */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: photo.selected ? 1 : 0,
            transition: 'opacity 400ms ease',
            background: 'linear-gradient(to top, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.04) 50%, transparent 100%)',
          }}
        />

        {/* Watermark — barely perceptible */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-white/[0.04] font-serif text-xl rotate-[-30deg] tracking-[0.25em]">
            FRAME
          </span>
        </div>
      </div>

      {selectable && (
        <button
          className={`absolute top-2.5 right-2.5 z-20 w-6 h-6 rounded-full flex items-center justify-center
            ${photo.selected ? '' : 'opacity-0 group-hover:opacity-100'}`}
          style={{
            backgroundColor: photo.selected ? '#C9A96E' : 'rgba(8,7,6,0.4)',
            backdropFilter: 'blur(12px)',
            boxShadow: photo.selected
              ? '0 0 0 1px rgba(201,169,110,0.5), 0 0 12px rgba(201,169,110,0.35)'
              : '0 0 0 1px rgba(255,255,255,0.12)',
            transition: 'background-color 280ms ease, box-shadow 280ms ease, opacity 220ms ease',
          }}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(photo.id) }}
          aria-label={photo.selected ? 'Deselect photo' : 'Select photo'}
        >
          <Check
            size={11}
            strokeWidth={2.5}
            className="text-stone-950"
            style={{
              animation: photo.selected ? 'checkPop 380ms cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
              opacity: photo.selected ? 1 : 0,
              transform: photo.selected ? 'scale(1)' : 'scale(0.3)',
              transition: photo.selected ? 'none' : 'opacity 160ms ease, transform 160ms ease',
            }}
          />
        </button>
      )}
    </div>
  )
}
