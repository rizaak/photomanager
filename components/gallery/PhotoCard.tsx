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
        // Subtle inward press on select — deselect springs back with ease-out
        transform: photo.selected ? 'scale(0.982)' : 'scale(1)',
        transition: 'transform 320ms ease-out, box-shadow 350ms ease',
        // Soft glow replaces the hard 2px border
        boxShadow: photo.selected
          ? '0 0 0 1px rgba(201,169,110,0.35), 0 0 28px rgba(201,169,110,0.14), 0 6px 24px rgba(0,0,0,0.5)'
          : '0 4px 20px rgba(0,0,0,0.55)',
      }}
    >
      {/* Photo — click to open modal */}
      <div
        className="relative w-full cursor-pointer"
        style={{ paddingBottom }}
        onClick={() => onOpen(index)}
      >
        {/* Placeholder with brightness boost */}
        <div
          className={`absolute inset-0 ${photo.placeholderColor} transition-[filter] duration-300 brightness-[1.06] group-hover:brightness-[1.12]`}
        />

        {/* Warm selection overlay — always mounted, cross-fades */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: photo.selected ? 1 : 0,
            transition: 'opacity 380ms ease',
            background:
              'linear-gradient(to top, rgba(201,169,110,0.14) 0%, rgba(201,169,110,0.05) 45%, transparent 100%)',
          }}
        />

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-white/[0.07] font-serif text-xl rotate-[-30deg] tracking-[0.25em]">
            FRAME
          </span>
        </div>
      </div>

      {/* Select button — only when gallery is selectable */}
      {selectable && (
        <button
          className={`absolute top-2.5 right-2.5 z-20 w-6 h-6 rounded-full flex items-center justify-center
            ${photo.selected ? '' : 'opacity-0 group-hover:opacity-100'}`}
          style={{
            // Frosted glass when idle → solid gold when selected
            backgroundColor: photo.selected ? '#C9A96E' : 'rgba(8,7,6,0.42)',
            backdropFilter: 'blur(10px)',
            // Soft ring — no hard border
            boxShadow: photo.selected
              ? '0 0 0 1px rgba(201,169,110,0.55), 0 0 14px rgba(201,169,110,0.4)'
              : '0 0 0 1px rgba(255,255,255,0.14)',
            transition: 'background-color 280ms ease, box-shadow 280ms ease, opacity 220ms ease',
          }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect(photo.id)
          }}
          aria-label={photo.selected ? 'Deselect photo' : 'Select photo'}
        >
          {/* Check icon — always in DOM, animates in/out */}
          <Check
            size={11}
            strokeWidth={2.5}
            className="text-stone-950"
            style={{
              // Pop in when selected, fade-shrink out when deselected
              animation: photo.selected
                ? 'checkPop 380ms cubic-bezier(0.34,1.56,0.64,1) forwards'
                : 'none',
              opacity: photo.selected ? 1 : 0,
              transform: photo.selected ? 'scale(1)' : 'scale(0.3)',
              transition: photo.selected
                ? 'none'                              // animation handles entrance
                : 'opacity 160ms ease, transform 160ms ease', // smooth exit
            }}
          />
        </button>
      )}
    </div>
  )
}
