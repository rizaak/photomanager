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
    ...(isPortrait
      ? { height: MAX_H, width: 'auto' }
      : { width: MAX_W, height: 'auto' }),
  }
}

export function PhotoModal({ photos, initialIndex, onClose, onToggleSelect }: PhotoModalProps) {
  const [index, setIndex] = useState(initialIndex)
  const photo = photos[index]

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const goNext = useCallback(
    () => setIndex((i) => Math.min(photos.length - 1, i + 1)),
    [photos.length],
  )

  // Scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Keyboard navigation
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
      className="fixed inset-0 z-50 bg-stone-950 flex flex-col"
      style={{ animation: 'fadeIn 180ms ease forwards' }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 h-12 border-b border-stone-900 shrink-0">
        <span className="text-stone-500 text-xs font-sans tracking-wide">
          {photo.filename}
        </span>
        <div className="flex items-center gap-5">
          <span className="text-stone-700 text-xs font-sans tabular-nums">
            {index + 1}&thinsp;/&thinsp;{photos.length}
          </span>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Photo area — click backdrop to close */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative cursor-zoom-out"
        onClick={onClose}
      >
        {/* Prev */}
        <button
          className="absolute left-4 z-10 flex items-center justify-center w-10 h-10 text-stone-600 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-default cursor-default"
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          disabled={index === 0}
          aria-label="Previous photo"
        >
          <ChevronLeft size={28} strokeWidth={1} />
        </button>

        {/* Photo */}
        <div
          key={photo.id}
          className="relative cursor-default"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: 'scaleIn 220ms ease forwards' }}
        >
          <div
            className={`${photo.placeholderColor} relative`}
            style={getPhotoStyle(photo)}
          >
            {/* Watermark overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-white/5 font-serif text-6xl rotate-[-30deg] tracking-[0.3em]">
                FRAME
              </span>
            </div>

            {/* Selected indicator on modal photo */}
            {photo.selected && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-stone-950/60 px-2.5 py-1.5 backdrop-blur-sm">
                <Heart size={11} strokeWidth={0} className="fill-accent" />
                <span className="text-accent text-[11px] font-sans tracking-wide">Selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Next */}
        <button
          className="absolute right-4 z-10 flex items-center justify-center w-10 h-10 text-stone-600 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-default cursor-default"
          onClick={(e) => { e.stopPropagation(); goNext() }}
          disabled={index === photos.length - 1}
          aria-label="Next photo"
        >
          <ChevronRight size={28} strokeWidth={1} />
        </button>
      </div>

      {/* Bottom bar */}
      <footer className="flex items-center justify-between px-5 h-14 border-t border-stone-900 shrink-0">
        <button
          onClick={() => onToggleSelect(photo.id)}
          className={`group flex items-center gap-2 text-sm font-sans transition-colors ${
            photo.selected
              ? 'text-accent'
              : 'text-stone-500 hover:text-stone-200'
          }`}
        >
          <Heart
            size={15}
            strokeWidth={photo.selected ? 0 : 1.5}
            className={`transition-all ${photo.selected ? 'fill-accent' : 'group-hover:fill-stone-200 group-hover:stroke-stone-200'}`}
          />
          {photo.selected ? 'Selected' : 'Select'}
        </button>

        {/* Keyboard hints */}
        <div className="hidden md:flex items-center gap-4 text-[11px] text-stone-800 font-sans">
          <span>← → navigate</span>
          <span>F favorite</span>
          <span>ESC close</span>
        </div>
      </footer>
    </div>
  )
}
