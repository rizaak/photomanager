'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import type { Photo } from '@/lib/types'

interface PhotoModalProps {
  photos: Photo[]
  initialIndex: number
  onClose: () => void
  onToggleSelect: (id: string) => void
}

function getPhotoStyle(photo: Photo): React.CSSProperties {
  const isPortrait = photo.height >= photo.width
  const MAX_H = 'calc(100vh - 160px)'
  const MAX_W = 'calc(100vw - 160px)'
  return {
    aspectRatio: `${photo.width} / ${photo.height}`,
    maxHeight: MAX_H,
    maxWidth: MAX_W,
    ...(isPortrait ? { height: MAX_H, width: 'auto' } : { width: MAX_W, height: 'auto' }),
  }
}

export function PhotoModal({ photos, initialIndex, onClose, onToggleSelect }: PhotoModalProps) {
  const [index, setIndex] = useState(initialIndex)
  const [fading, setFading] = useState(false)
  const photo = photos[index]

  // Cross-fade between photos instead of instant swap
  const navigate = useCallback(
    (dir: 1 | -1) => {
      setFading(true)
      setTimeout(() => {
        setIndex((i) => Math.max(0, Math.min(photos.length - 1, i + dir)))
        setFading(false)
      }, 110)
    },
    [photos.length],
  )

  const goPrev = useCallback(() => navigate(-1), [navigate])
  const goNext = useCallback(() => navigate(1), [navigate])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'f' || e.key === 'F') onToggleSelect(photo.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext, onToggleSelect, photo.id])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#0D0C0B', animation: 'fadeIn 180ms ease forwards' }}
    >
      {/* Header — softer separator */}
      <header className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/[0.05]">
        <span className="text-stone-600 text-xs font-sans tracking-wide">{photo.filename}</span>
        <div className="flex items-center gap-5">
          <span className="text-stone-700 text-xs font-sans tabular-nums">
            {index + 1}&thinsp;/&thinsp;{photos.length}
          </span>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-200 transition-colors"
            aria-label="Close"
          >
            <X size={17} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Photo area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative cursor-zoom-out"
        onClick={onClose}
      >
        {/* Nav — frosted circle appears on hover, not just a color shift */}
        <button
          className="absolute left-4 z-10 flex items-center justify-center w-11 h-11 rounded-full text-stone-500 hover:text-white hover:bg-white/[0.07] transition-all duration-200 disabled:opacity-20 disabled:cursor-default cursor-default"
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          disabled={index === 0}
          aria-label="Previous photo"
        >
          <ChevronLeft size={24} strokeWidth={1.25} />
        </button>

        {/* Photo — crossfades on navigate, no key remount */}
        <div
          className="relative cursor-default"
          onClick={(e) => e.stopPropagation()}
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 110ms ease' }}
        >
          <div className={`${photo.placeholderColor} relative`} style={getPhotoStyle(photo)}>
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-white/[0.04] font-serif text-6xl rotate-[-30deg] tracking-[0.3em]">
                FRAME
              </span>
            </div>

            {/* Selection indicator — small glowing dot, not a heavy badge */}
            <div
              className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent transition-all duration-300"
              style={{
                opacity: photo.selected ? 1 : 0,
                boxShadow: photo.selected ? '0 0 8px rgba(201,169,110,0.7)' : 'none',
                transform: photo.selected ? 'scale(1)' : 'scale(0.4)',
                transition: 'opacity 250ms ease, transform 250ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 250ms ease',
              }}
            />
          </div>
        </div>

        <button
          className="absolute right-4 z-10 flex items-center justify-center w-11 h-11 rounded-full text-stone-500 hover:text-white hover:bg-white/[0.07] transition-all duration-200 disabled:opacity-20 disabled:cursor-default cursor-default"
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={(e) => { e.stopPropagation(); goNext() }}
          disabled={index === photos.length - 1}
          aria-label="Next photo"
        >
          <ChevronRight size={24} strokeWidth={1.25} />
        </button>
      </div>

      {/* Footer — softer separator */}
      <footer className="flex items-center justify-between px-5 h-14 shrink-0 border-t border-white/[0.05]">
        <button
          onClick={() => onToggleSelect(photo.id)}
          className={`group flex items-center gap-2.5 text-sm font-sans transition-colors duration-200 ${
            photo.selected ? 'text-accent' : 'text-stone-500 hover:text-stone-200'
          }`}
        >
          <Heart
            size={15}
            strokeWidth={photo.selected ? 0 : 1.5}
            style={{
              fill: photo.selected ? '#C9A96E' : 'transparent',
              transition: 'fill 250ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
              transform: photo.selected ? 'scale(1.15)' : 'scale(1)',
            }}
          />
          {photo.selected ? 'Selected' : 'Select'}
        </button>

        <div className="hidden md:flex items-center gap-4 text-[11px] text-stone-800 font-sans select-none">
          <span>← → navigate</span>
          <span>F select</span>
          <span>ESC close</span>
        </div>
      </footer>
    </div>
  )
}
