'use client'

import { use, useState, useEffect, useRef, useCallback } from 'react'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { mockGalleries, mockPhotos, mockPhotographer } from '@/lib/mock-data'
import { CheckCircle2 } from 'lucide-react'

const HIDE_DELAY = 3800
const SAVE_DEBOUNCE = 650

export default function ClientGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const gallery = mockGalleries.find((g) => g.id === id) ?? mockGalleries[0]

  const [selectedIds, setSelectedIds] = useState<string[]>(
    mockPhotos.filter((p) => p.selected).map((p) => p.id),
  )
  const [saved, setSaved] = useState(false)
  const [uiVisible, setUiVisible] = useState(true)

  const uiTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // ── Auto-hide chrome ──────────────────────────────────────────────────────
  const revealUi = useCallback(() => {
    setUiVisible(true)
    clearTimeout(uiTimer.current)
    uiTimer.current = setTimeout(() => setUiVisible(false), HIDE_DELAY)
  }, [])

  useEffect(() => {
    revealUi()
    window.addEventListener('mousemove', revealUi)
    window.addEventListener('scroll', revealUi, { passive: true })
    window.addEventListener('touchstart', revealUi, { passive: true })
    return () => {
      window.removeEventListener('mousemove', revealUi)
      window.removeEventListener('scroll', revealUi)
      window.removeEventListener('touchstart', revealUi)
      clearTimeout(uiTimer.current)
      clearTimeout(saveTimer.current)
      clearTimeout(savedTimer.current)
    }
  }, [revealUi])

  // ── Auto-save ─────────────────────────────────────────────────────────────
  // Debounce so rapid taps collapse into a single save. In production this
  // would be an API call; here it just shows the confirmation toast.
  function handleSelectionChange(ids: string[]) {
    setSelectedIds(ids)
    setSaved(false)
    clearTimeout(saveTimer.current)
    clearTimeout(savedTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaved(true)
      savedTimer.current = setTimeout(() => setSaved(false), 1800)
    }, SAVE_DEBOUNCE)
  }

  const chromeFade: React.CSSProperties = {
    opacity: uiVisible ? 1 : 0,
    transition: 'opacity 600ms ease',
    pointerEvents: uiVisible ? 'auto' : 'none',
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1C1917' }}>

      {/* ── Header — gradient veil ─────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-30 px-6 pt-5 pb-12"
        style={{
          background: 'linear-gradient(to bottom, rgba(15,13,12,0.82) 0%, transparent 100%)',
          ...chromeFade,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-stone-600 font-sans uppercase tracking-[0.2em] mb-0.5 select-none">
              {mockPhotographer.name}
            </p>
            <h1 className="font-serif text-base text-stone-300 leading-snug">{gallery.title}</h1>
          </div>

          {/* Selection count — lives in header, hides with chrome */}
          <p
            className="text-[11px] font-sans tabular-nums pt-0.5"
            style={{
              opacity: selectedIds.length > 0 ? 1 : 0,
              transition: 'opacity 300ms ease',
              pointerEvents: 'none',
              color: '#a8a29e', // stone-400
            }}
          >
            <span style={{ color: '#C9A96E' }}>{selectedIds.length}</span>
            {' selected'}
          </p>
        </div>
      </header>

      {/* ── Gallery ───────────────────────────────────────────────────────── */}
      <div className="p-1.5">
        <GalleryGrid
          photos={mockPhotos}
          selectable
          onSelectionChange={handleSelectionChange}
        />
      </div>

      {/* ── Saved toast — independent of UI visiblity ─────────────────────── */}
      {/* Appears briefly after each debounced save; anchored to bottom center */}
      <div
        className="fixed z-40 pointer-events-none"
        style={{
          bottom: '72px',
          left: '50%',
          transform: saved
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(5px)',
          opacity: saved ? 1 : 0,
          transition: 'opacity 280ms ease, transform 280ms ease',
        }}
      >
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: 'rgba(13,12,11,0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <CheckCircle2 size={11} strokeWidth={1.5} style={{ color: '#C9A96E' }} />
          <span className="text-[11px] font-sans text-stone-400 tracking-wide">Saved</span>
        </div>
      </div>
    </div>
  )
}
