'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import type { Photo } from '@/lib/types'

interface PhotoModalProps {
  photos: Photo[]
  initialIndex: number
  onClose: () => void
  onToggleSelect: (id: string) => void
}

// How long chrome stays visible after last interaction
const CHROME_HIDE_MS = 3800
// Minimum horizontal travel (px) to count as a swipe
const SWIPE_X = 52
// Maximum vertical drift allowed during swipe
const SWIPE_Y = 60

function getPhotoStyle(photo: Photo): React.CSSProperties {
  const isPortrait = photo.height >= photo.width
  const MAX_H = 'calc(100vh - 120px)'
  const MAX_W = 'calc(100vw - 80px)'
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
  const [chromeVisible, setChromeVisible] = useState(true)

  const chromeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Swipe tracking
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const swipeFired = useRef(false)

  const photo = photos[index]

  // ── Chrome auto-hide ─────────────────────────────────────────────────────
  const revealChrome = useCallback(() => {
    setChromeVisible(true)
    clearTimeout(chromeTimer.current)
    chromeTimer.current = setTimeout(() => setChromeVisible(false), CHROME_HIDE_MS)
  }, [])

  const chromeFade: React.CSSProperties = {
    opacity: chromeVisible ? 1 : 0,
    transition: 'opacity 550ms ease',
    pointerEvents: chromeVisible ? 'auto' : 'none',
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  const navigate = useCallback(
    (dir: 1 | -1) => {
      revealChrome()
      setFading(true)
      setTimeout(() => {
        setIndex((i) => Math.max(0, Math.min(photos.length - 1, i + dir)))
        setFading(false)
      }, 160)
    },
    [photos.length, revealChrome],
  )

  const goPrev = useCallback(() => navigate(-1), [navigate])
  const goNext = useCallback(() => navigate(1), [navigate])

  // ── Swipe gesture (pointer events work for mouse + touch + stylus) ────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY }
    swipeFired.current = false
  }, [])

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!swipeStart.current) return
      const dx = e.clientX - swipeStart.current.x
      const dy = e.clientY - swipeStart.current.y
      swipeStart.current = null
      if (Math.abs(dx) > SWIPE_X && Math.abs(dy) < SWIPE_Y) {
        swipeFired.current = true
        if (dx < 0) goNext(); else goPrev()
      }
    },
    [goNext, goPrev],
  )

  // Swallow the click that follows a successful swipe so it doesn't close the modal
  const handleBackdropClick = useCallback(() => {
    if (swipeFired.current) { swipeFired.current = false; return }
    onClose()
  }, [onClose])

  // ── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    revealChrome()
    return () => {
      document.body.style.overflow = prev
      clearTimeout(chromeTimer.current)
    }
  }, [revealChrome])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'f' || e.key === 'F') onToggleSelect(photo.id)
      revealChrome()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext, onToggleSelect, photo.id, revealChrome])

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: '#0D0C0B', animation: 'modalReveal 520ms cubic-bezier(0.22,1,0.36,1) forwards' }}
      // Any mouse movement or touch reveals chrome
      onMouseMove={revealChrome}
      onTouchStart={revealChrome}
    >

      {/* ── Floating header veil — gradient, not a bar ────────────────────── */}
      <header
        className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 pt-4 pb-14 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(13,12,11,0.75) 0%, transparent 100%)',
          ...chromeFade,
          pointerEvents: chromeVisible ? 'auto' : 'none',
        }}
      >
        {/* Counter only — filename ("IMG_1001.jpg") is meaningless to the client */}
        <span className="text-stone-600 text-xs font-sans tabular-nums select-none pointer-events-none">
          {index + 1}&thinsp;/&thinsp;{photos.length}
        </span>
        <button
          onClick={onClose}
          className="text-stone-500 hover:text-stone-200 transition-colors duration-200"
          aria-label="Close"
        >
          <X size={17} strokeWidth={1.5} />
        </button>
      </header>

      {/* ── Photo area — fills full viewport ─────────────────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleBackdropClick}
      >
        {/* ── Left nav zone — full height, wide enough to tap easily on mobile ── */}
        <button
          className="absolute left-0 top-0 h-full w-1/4 z-10 flex items-center justify-start pl-3"
          style={{ ...chromeFade, cursor: index === 0 ? 'default' : 'pointer' }}
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          disabled={index === 0}
          aria-label="Previous photo"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/[0.07] transition-all duration-200 disabled:opacity-20"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <ChevronLeft size={22} strokeWidth={1.25} />
          </div>
        </button>

        {/* ── Photo — crossfades on navigate ────────────────────────────────── */}
        <div
          className="relative"
          onClick={(e) => e.stopPropagation()}
          style={{
            opacity: fading ? 0 : 1,
            transition: fading
              ? 'opacity 160ms ease-in'
              : 'opacity 340ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <div className={`${photo.placeholderColor} relative`} style={getPhotoStyle(photo)}>
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-white/[0.04] font-serif text-6xl rotate-[-30deg] tracking-[0.3em]">
                FRAME
              </span>
            </div>

            {/* Selection dot — minimal, no button chrome */}
            <div
              className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent"
              style={{
                opacity: photo.selected ? 1 : 0,
                boxShadow: photo.selected ? '0 0 8px rgba(201,169,110,0.7)' : 'none',
                transform: photo.selected ? 'scale(1)' : 'scale(0.4)',
                transition: 'opacity 250ms ease, transform 250ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 250ms ease',
              }}
            />
          </div>
        </div>

        {/* ── Right nav zone ─────────────────────────────────────────────────── */}
        <button
          className="absolute right-0 top-0 h-full w-1/4 z-10 flex items-center justify-end pr-3"
          style={{ ...chromeFade, cursor: index === photos.length - 1 ? 'default' : 'pointer' }}
          onClick={(e) => { e.stopPropagation(); goNext() }}
          disabled={index === photos.length - 1}
          aria-label="Next photo"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/[0.07] transition-all duration-200"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <ChevronRight size={22} strokeWidth={1.25} />
          </div>
        </button>
      </div>

      {/* ── Floating footer veil ─────────────────────────────────────────── */}
      <footer
        className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-5 pt-14 pb-5"
        style={{
          background: 'linear-gradient(to top, rgba(13,12,11,0.75) 0%, transparent 100%)',
          ...chromeFade,
          pointerEvents: chromeVisible ? 'auto' : 'none',
        }}
      >
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

        {/* Keyboard hints — desktop only, very dim */}
        <div className="hidden md:flex items-center gap-4 text-[11px] text-stone-800 font-sans select-none">
          <span>← → navigate</span>
          <span>F select</span>
          <span>ESC close</span>
        </div>
      </footer>
    </div>
  )
}
