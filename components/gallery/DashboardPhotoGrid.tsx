'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus, ChevronDown, ChevronLeft, ChevronRight, Check, Trash2, Loader2, AlertCircle,
  Search, X, CheckCircle2, MessageCircle, Pencil,
  MoreHorizontal, Droplets, GripVertical,
} from 'lucide-react'
import { PhotoContextMenu, type WatermarkPresetOption } from './PhotoContextMenu'
import { DeleteSectionDialog } from './DeleteSectionDialog'
import { SectionDialog, type SectionRecord } from './SectionDialog'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GridSection {
  id:              string
  title:           string
  sortOrder:       number
  visibleToClient: boolean
}

export interface GridPhoto {
  id:                       string
  filename:                 string
  width:                    number
  height:                   number
  thumbnailUrl:             string | null
  sectionId:                string | null
  status:                   'ready' | 'processing' | 'failed'
  editStatus?:              string
  isClientSelected?:        boolean
  hasComments?:             boolean
  hasFinal?:                boolean
  labels?:                  string[]
  appliedWatermarkPresetId?: string | null
}

interface PhotoFilters {
  q:              string
  status:         string
  sectionId:      string
  sort:           string
  clientSelected: boolean
  hasComments:    boolean
  hasFinal:       boolean
  labels:         string[]
}

const DEFAULT_FILTERS: PhotoFilters = {
  q: '', status: '', sectionId: '', sort: '',
  clientSelected: false, hasComments: false, hasFinal: false, labels: [],
}

const STATUS_OPTIONS = [
  { value: 'ready',        label: 'Ready'        },
  { value: 'processing',   label: 'Processing'   },
  { value: 'selected',     label: 'Selected'     },
  { value: 'editing',      label: 'Editing'      },
  { value: 'final_ready',  label: 'Final ready'  },
  { value: 'failed',       label: 'Failed'       },
]

const SORT_OPTIONS = [
  { value: '',               label: 'Default order'  },
  { value: 'date_desc',      label: 'Newest first'   },
  { value: 'date_asc',       label: 'Oldest first'   },
  { value: 'filename',       label: 'Filename A–Z'   },
  { value: 'selected_first', label: 'Selected first' },
  { value: 'final_first',    label: 'Final first'    },
]

// ── PhotoFilterBar ────────────────────────────────────────────────────────────

interface PhotoFilterBarProps {
  filters:   PhotoFilters
  sections:  GridSection[]
  allLabels: string[]
  total:     number
  isLoading: boolean
  onChange:  (f: PhotoFilters) => void
}

function PhotoFilterBar({ filters, sections, allLabels, total, isLoading, onChange }: PhotoFilterBarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const searchRef   = useRef<HTMLInputElement>(null)

  const set = useCallback(
    (patch: Partial<PhotoFilters>) => onChange({ ...filters, ...patch }),
    [filters, onChange],
  )

  const handleSearch = (v: string) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => set({ q: v }), 350)
  }

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const hasFilters = !!(
    filters.q || filters.status || filters.sectionId || filters.sort ||
    filters.clientSelected || filters.hasComments || filters.hasFinal || filters.labels.length
  )

  const clearAll = () => {
    if (searchRef.current) searchRef.current.value = ''
    onChange(DEFAULT_FILTERS)
  }

  const toggleLabel = (label: string) => {
    const next = filters.labels.includes(label)
      ? filters.labels.filter((l) => l !== label)
      : [...filters.labels, label]
    set({ labels: next })
  }

  return (
    <div className={`mb-5 transition-opacity duration-150 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
      {/* Row 1 — search + sort + count */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1 min-w-0">
          <Search size={11} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            defaultValue={filters.q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by filename…"
            className="w-full pl-8 pr-3 py-1.5 text-xs font-sans text-stone-700 placeholder-stone-300 bg-white border border-stone-200 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>

        <div className="relative shrink-0">
          <select
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value })}
            className="h-[30px] pl-2.5 pr-7 text-[11px] font-sans text-stone-600 bg-white border border-stone-200 focus:outline-none appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-stone-400" width="8" height="5" viewBox="0 0 8 5" fill="currentColor">
            <path d="M0 0l4 5 4-5z" />
          </svg>
        </div>

        <p className="shrink-0 text-[11px] font-sans text-stone-400 tabular-nums">
          {total.toLocaleString()} photo{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Row 2 — filter chips */}
      <div className="flex items-center flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            active={filters.status === opt.value}
            onClick={() => set({ status: filters.status === opt.value ? '' : opt.value })}
          >
            {opt.label}
          </FilterChip>
        ))}

        <div className="w-px h-3.5 bg-stone-200 mx-0.5 shrink-0" />

        {sections.length > 0 && (
          <div className="relative shrink-0">
            <select
              value={filters.sectionId}
              onChange={(e) => set({ sectionId: e.target.value })}
              className={`h-[26px] pl-2.5 pr-6 text-[11px] font-sans border focus:outline-none appearance-none cursor-pointer transition-colors ${
                filters.sectionId
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'bg-white border-stone-200 text-stone-500'
              }`}
            >
              <option value="">All sections</option>
              <option value="none">No section</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <svg className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 ${filters.sectionId ? 'text-white' : 'text-stone-400'}`} width="7" height="4" viewBox="0 0 7 4" fill="currentColor">
              <path d="M0 0l3.5 4L7 0z" />
            </svg>
          </div>
        )}

        <FilterChip active={filters.clientSelected} onClick={() => set({ clientSelected: !filters.clientSelected })}>
          Client selected
        </FilterChip>
        <FilterChip active={filters.hasComments} onClick={() => set({ hasComments: !filters.hasComments })}>
          Has comments
        </FilterChip>
        <FilterChip active={filters.hasFinal} onClick={() => set({ hasFinal: !filters.hasFinal })}>
          Has final
        </FilterChip>

        {allLabels.length > 0 && (
          <>
            <div className="w-px h-3.5 bg-stone-200 mx-0.5 shrink-0" />
            {allLabels.map((label) => (
              <FilterChip key={label} active={filters.labels.includes(label)} onClick={() => toggleLabel(label)}>
                #{label}
              </FilterChip>
            ))}
          </>
        )}

        {hasFilters && (
          <button onClick={clearAll} className="ml-auto flex items-center gap-1 text-[11px] font-sans text-stone-400 hover:text-stone-600 transition-colors shrink-0">
            <X size={9} strokeWidth={2} />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 text-[11px] font-sans border transition-colors duration-150 ${
        active
          ? 'bg-stone-900 border-stone-900 text-white'
          : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700'
      }`}
    >
      {children}
    </button>
  )
}

// ── DashboardPhotoModal ───────────────────────────────────────────────────────

const CHROME_HIDE_MS = 3800
const SWIPE_X = 52
const SWIPE_Y = 60

interface DashboardPhotoModalProps {
  photos:          GridPhoto[]
  initialIndex:    number
  selectedIds:     Set<string>
  onClose:         () => void
  onToggleSelect:  (id: string) => void
}

function DashboardPhotoModal({ photos, initialIndex, selectedIds, onClose, onToggleSelect }: DashboardPhotoModalProps) {
  const [index, setIndex]           = useState(initialIndex)
  const [fading, setFading]         = useState(false)
  const [chromeVisible, setChrome]  = useState(true)
  const chromeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const swipeStart  = useRef<{ x: number; y: number } | null>(null)
  const swipeFired  = useRef(false)

  const photo      = photos[index]
  const isSelected = selectedIds.has(photo.id)

  const revealChrome = useCallback(() => {
    setChrome(true)
    clearTimeout(chromeTimer.current)
    chromeTimer.current = setTimeout(() => setChrome(false), CHROME_HIDE_MS)
  }, [])

  const chromeFade: React.CSSProperties = {
    opacity:       chromeVisible ? 1 : 0,
    transition:    'opacity 700ms ease',
    pointerEvents: chromeVisible ? 'auto' : 'none',
  }

  const navigate = useCallback((dir: 1 | -1) => {
    revealChrome()
    setFading(true)
    setTimeout(() => {
      setIndex((i) => Math.max(0, Math.min(photos.length - 1, i + dir)))
      setFading(false)
    }, 160)
  }, [photos.length, revealChrome])

  const goPrev = useCallback(() => navigate(-1), [navigate])
  const goNext = useCallback(() => navigate(1), [navigate])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY }
    swipeFired.current = false
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!swipeStart.current) return
    const dx = e.clientX - swipeStart.current.x
    const dy = e.clientY - swipeStart.current.y
    swipeStart.current = null
    if (Math.abs(dx) > SWIPE_X && Math.abs(dy) < SWIPE_Y) {
      swipeFired.current = true
      if (dx < 0) goNext(); else goPrev()
    }
  }, [goNext, goPrev])

  const handleBackdropClick = useCallback(() => {
    if (swipeFired.current) { swipeFired.current = false; return }
    onClose()
  }, [onClose])

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
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft')   goPrev()
      if (e.key === 'ArrowRight')  goNext()
      revealChrome()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext, revealChrome])

  const ar         = photo.height / photo.width
  const isPortrait = ar > 1
  const imgStyle: React.CSSProperties = {
    aspectRatio: `${photo.width} / ${photo.height}`,
    maxHeight:   'calc(100vh - 120px)',
    maxWidth:    'calc(100vw - 80px)',
    ...(isPortrait
      ? { height: 'calc(100vh - 120px)', width: 'auto' }
      : { width: 'calc(100vw - 80px)',   height: 'auto' }),
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: '#0D0C0B', animation: 'modalReveal 680ms cubic-bezier(0.22,1,0.36,1) forwards' }}
      onMouseMove={revealChrome}
      onTouchStart={revealChrome}
    >
      {/* Header */}
      <header
        className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 pt-4 pb-14 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(13,12,11,0.75) 0%, transparent 100%)',
          ...chromeFade,
          pointerEvents: chromeVisible ? 'auto' : 'none',
        }}
      >
        <span className="text-stone-600 text-xs font-sans tabular-nums select-none pointer-events-none">
          {index + 1}&thinsp;/&thinsp;{photos.length}
        </span>
        <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition-colors duration-200" aria-label="Close">
          <X size={17} strokeWidth={1.5} />
        </button>
      </header>

      {/* Photo area */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleBackdropClick}
      >
        {/* Left nav */}
        <button
          className="absolute left-0 top-0 h-full w-1/4 z-10 flex items-center justify-start pl-3"
          style={{ ...chromeFade, cursor: index === 0 ? 'default' : 'pointer' }}
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          disabled={index === 0}
          aria-label="Previous photo"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/[0.07] transition-all duration-200" style={{ backdropFilter: 'blur(8px)' }}>
            <ChevronLeft size={18} strokeWidth={1.25} />
          </div>
        </button>

        {/* Photo */}
        <div
          className="relative"
          onClick={(e) => e.stopPropagation()}
          style={{
            opacity:    fading ? 0 : 1,
            transition: fading ? 'opacity 180ms ease-in' : 'opacity 480ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <div className="bg-stone-800 relative" style={imgStyle}>
            {photo.thumbnailUrl && (
              <img
                src={photo.thumbnailUrl}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain opacity-0"
                style={{ transition: 'opacity 500ms ease' }}
                ref={(img) => { if (img?.complete) img.style.opacity = '1' }}
                onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
              />
            )}
            {/* Selection dot */}
            <div
              className="absolute top-3 right-3 w-2 h-2 rounded-full"
              style={{
                backgroundColor: '#C9A96E',
                opacity:    isSelected ? 1 : 0,
                boxShadow:  isSelected ? '0 0 8px rgba(201,169,110,0.7)' : 'none',
                transform:  isSelected ? 'scale(1)' : 'scale(0.4)',
                transition: 'opacity 400ms ease, transform 400ms cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
          </div>
        </div>

        {/* Right nav */}
        <button
          className="absolute right-0 top-0 h-full w-1/4 z-10 flex items-center justify-end pr-3"
          style={{ ...chromeFade, cursor: index === photos.length - 1 ? 'default' : 'pointer' }}
          onClick={(e) => { e.stopPropagation(); goNext() }}
          disabled={index === photos.length - 1}
          aria-label="Next photo"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/[0.07] transition-all duration-200" style={{ backdropFilter: 'blur(8px)' }}>
            <ChevronRight size={18} strokeWidth={1.25} />
          </div>
        </button>
      </div>

      {/* Footer */}
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
          className="transition-colors duration-200"
          aria-label={isSelected ? 'Deselect photo' : 'Select photo'}
          style={{ color: isSelected ? '#C9A96E' : '#78716c' }}
        >
          <CheckCircle2
            size={18}
            strokeWidth={1.25}
            style={{ transition: 'color 250ms ease' }}
          />
        </button>
        <span className="text-[11px] font-sans text-stone-600 truncate max-w-xs select-none">{photo.filename}</span>
      </footer>
    </div>
  )
}

// ── PhotoThumb ─────────────────────────────────────────────────────────────────

interface PhotoThumbProps {
  photo:             GridPhoto
  sections:          GridSection[]
  isSelected:        boolean
  openDropdown:      string | null
  watermarkQueued:   boolean
  onToggleSelect:    (id: string, e: React.MouseEvent) => void
  onOpenModal:       (id: string) => void
  onDropdownToggle:  (id: string) => void
  onAssign:          (id: string, sectionId: string | null) => void
  dropdownAnchor:    (el: HTMLDivElement | null, id: string) => void
  onContextMenu:     (e: React.MouseEvent, photo: GridPhoto) => void
  onMoreActions:     (e: React.MouseEvent, photo: GridPhoto) => void
  photoRef:          (el: HTMLDivElement | null) => void
  isClickSuppressed: () => boolean
}

function PhotoThumb({
  photo, sections, isSelected,
  openDropdown, watermarkQueued, onToggleSelect, onOpenModal, onDropdownToggle, onAssign, dropdownAnchor,
  onContextMenu, onMoreActions, photoRef, isClickSuppressed,
}: PhotoThumbProps) {
  const ar             = photo.height / photo.width
  const pb             = `${Math.min(Math.max(ar * 100, 66), 150)}%`
  const currentSection = sections.find((s) => s.id === photo.sectionId)
  const isOpen         = openDropdown === photo.id
  const isReady        = photo.status === 'ready'

  return (
    <div
      ref={photoRef}
      className={`break-inside-avoid relative overflow-hidden bg-stone-100 group ${isReady ? 'cursor-pointer' : ''}`}
      onClick={(e) => {
        if (!isReady || isClickSuppressed()) return
        if (e.detail >= 2) { onOpenModal(photo.id); return }
        onToggleSelect(photo.id, e)
      }}
      onContextMenu={(e) => { if (isReady) { e.preventDefault(); onContextMenu(e, photo) } }}
    >
      <div className="relative w-full" style={{ paddingBottom: pb }}>

        {/* Thumbnail */}
        {isReady && photo.thumbnailUrl && (
          <img
            src={photo.thumbnailUrl}
            alt={photo.filename}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            style={{ transition: 'opacity 400ms ease' }}
            ref={(img) => { if (img?.complete) img.style.opacity = '1' }}
            onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
          />
        )}

        {/* Processing */}
        {photo.status === 'processing' && (
          <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center gap-2">
            <Loader2 size={16} strokeWidth={1.5} className="text-stone-400 animate-spin" />
            <span className="text-[10px] font-sans text-stone-400">Processing</span>
          </div>
        )}

        {/* Failed */}
        {photo.status === 'failed' && (
          <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center gap-2">
            <AlertCircle size={16} strokeWidth={1.5} className="text-red-400" />
            <span className="text-[10px] font-sans text-red-400">Failed</span>
          </div>
        )}

        {/* Selection ring */}
        {isSelected && (
          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 2px rgba(201,169,110,0.8)' }} />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 pointer-events-none bg-transparent group-hover:bg-black/[0.12] transition-colors duration-200" />

        {/* ── Top-left: select checkbox (hover + selected) ─────────────── */}
        {isReady && (
          <div
            className={`absolute top-1.5 left-1.5 transition-opacity duration-200 ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-60'
            }`}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
              style={isSelected
                ? { backgroundColor: '#C9A96E' }
                : { backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }
              }
            >
              {isSelected && <Check size={10} strokeWidth={2.5} className="text-stone-950" />}
            </div>
          </div>
        )}

        {/* ── Top-right: status indicators + more actions (hover) ──────── */}
        {isReady && (
          <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
            {/* Watermark queued */}
            {watermarkQueued && (
              <span title="Watermark processing" className="w-4 h-4 rounded-full bg-black/70 backdrop-blur flex items-center justify-center">
                <Droplets size={8} strokeWidth={2} className="text-sky-300 animate-pulse" />
              </span>
            )}

            {/* Status dots — show on hover */}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {photo.isClientSelected && (
                <span title="Client selected" className="w-4 h-4 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                  <Check size={8} strokeWidth={2.5} className="text-amber-300" />
                </span>
              )}
              {photo.hasComments && (
                <span title="Has comments" className="w-4 h-4 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                  <MessageCircle size={8} strokeWidth={2} className="text-white" />
                </span>
              )}
              {photo.hasFinal && (
                <span title="Final ready" className="w-4 h-4 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                  <CheckCircle2 size={8} strokeWidth={2} className="text-emerald-400" />
                </span>
              )}
              {photo.editStatus === 'EDITING' && !photo.hasFinal && (
                <span title="In editing" className="w-4 h-4 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                  <Pencil size={7} strokeWidth={2} className="text-sky-300" />
                </span>
              )}
            </div>

            {/* More actions button */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); onMoreActions(e, photo) }}
                aria-label="More actions"
                title="More actions"
                className="w-6 h-6 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <MoreHorizontal size={10} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* ── Bottom-left: section assignment (hover) ──────────────────── */}
        {isReady && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-1.5 left-1.5" ref={(el) => dropdownAnchor(el, photo.id)}>
              <button
                onClick={(e) => { e.stopPropagation(); onDropdownToggle(photo.id) }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-sans text-white leading-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(8px)' }}
              >
                {currentSection?.title ?? 'Assign section'}
                <ChevronDown size={8} strokeWidth={1.5} />
              </button>

              {isOpen && (
                <div className="absolute bottom-full left-0 mb-1 bg-white border border-stone-200 shadow-xl min-w-[160px] z-20">
                  <button onClick={() => onAssign(photo.id, null)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-sans text-left hover:bg-stone-50 transition-colors">
                    {photo.sectionId === null ? <Check size={11} strokeWidth={2} className="text-stone-800 shrink-0" /> : <span className="w-[11px] shrink-0" />}
                    <span className={photo.sectionId === null ? 'text-stone-800 font-medium' : 'text-stone-500'}>No section</span>
                  </button>
                  {sections.length > 0 && <div className="border-t border-stone-100 mx-3" />}
                  {sections.map((s) => (
                    <button key={s.id} onClick={() => onAssign(photo.id, s.id)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-sans text-left hover:bg-stone-50 transition-colors">
                      {photo.sectionId === s.id ? <Check size={11} strokeWidth={2} className="text-stone-800 shrink-0" /> : <span className="w-[11px] shrink-0" />}
                      <span className={photo.sectionId === s.id ? 'text-stone-800 font-medium' : 'text-stone-600'}>{s.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── BulkWatermarkDropdown ─────────────────────────────────────────────────────

function BulkWatermarkDropdown({
  presets, onApply,
}: {
  presets: WatermarkPresetOption[]
  onApply: (presetId: string | null, remove: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-sans text-stone-700 border border-stone-300 hover:border-stone-400 transition-colors"
      >
        <Droplets size={11} strokeWidth={1.5} />
        Watermark <ChevronDown size={11} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 shadow-xl min-w-[180px] z-30 py-1">
          <button onClick={() => { setOpen(false); onApply(null, false) }} className="w-full flex items-center px-3 py-2 text-xs font-sans text-stone-700 hover:bg-stone-50 transition-colors text-left">
            Apply default
          </button>
          {presets.map((p) => (
            <button key={p.id} onClick={() => { setOpen(false); onApply(p.id, false) }} className="w-full flex items-center px-3 py-2 text-xs font-sans text-stone-700 hover:bg-stone-50 transition-colors text-left">
              {p.name}
            </button>
          ))}
          {presets.length > 0 && <div className="border-t border-stone-100 mx-3 my-1" />}
          <button onClick={() => { setOpen(false); onApply(null, true) }} className="w-full flex items-center px-3 py-2 text-xs font-sans text-stone-500 hover:bg-stone-50 transition-colors text-left">
            Remove watermark
          </button>
        </div>
      )}
    </div>
  )
}

// ── BulkMoveDropdown ──────────────────────────────────────────────────────────

function BulkMoveDropdown({ sections, onMove }: { sections: GridSection[]; onMove: (id: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-sans text-stone-700 border border-stone-300 hover:border-stone-400 transition-colors">
        Move to <ChevronDown size={11} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 shadow-xl min-w-[150px] z-30">
          <button onClick={() => { setOpen(false); onMove(null) }} className="w-full flex items-center px-3 py-2.5 text-xs font-sans text-stone-500 hover:bg-stone-50 transition-colors text-left">No section</button>
          {sections.length > 0 && <div className="border-t border-stone-100 mx-3" />}
          {sections.map((s) => (
            <button key={s.id} onClick={() => { setOpen(false); onMove(s.id) }} className="w-full flex items-center px-3 py-2.5 text-xs font-sans text-stone-700 hover:bg-stone-50 transition-colors text-left">{s.title}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── DashboardPhotoGrid ────────────────────────────────────────────────────────

interface DashboardPhotoGridProps {
  galleryId:               string
  initialPhotos:           GridPhoto[]
  initialSections:         GridSection[]
  initialHasMore:          boolean
  initialTotal:            number
  initialAllLabels:        string[]
  initialWatermarkPresets?: WatermarkPresetOption[]
}

export function DashboardPhotoGrid({
  galleryId, initialPhotos, initialSections,
  initialHasMore, initialTotal, initialAllLabels,
  initialWatermarkPresets = [],
}: DashboardPhotoGridProps) {
  const [sections,         setSections]         = useState(initialSections)
  const [photos,           setPhotos]           = useState(initialPhotos)
  const [filters,          setFilters]          = useState<PhotoFilters>(DEFAULT_FILTERS)
  const [allLabels,        setAllLabels]        = useState(initialAllLabels)
  const [total,            setTotal]            = useState(initialTotal)
  const [hasMore,          setHasMore]          = useState(initialHasMore)
  const [page,             setPage]             = useState(1)
  const [isLoading,        setIsLoading]        = useState(false)
  const [isLoadingMore,    setIsLoadingMore]    = useState(false)
  const [sectionDialog,    setSectionDialog]    = useState<{ mode: 'new' } | { mode: 'edit'; section: GridSection } | null>(null)
  const [openDropdown,     setOpenDropdown]     = useState<string | null>(null)
  const [selectedIds,      setSelectedIds]      = useState<Set<string>>(new Set())
  const [contextMenu,      setContextMenu]      = useState<{ photo: GridPhoto; x: number; y: number } | null>(null)
  const [watermarkPresets, setWatermarkPresets] = useState<WatermarkPresetOption[]>(initialWatermarkPresets)
  const [watermarkQueued,  setWatermarkQueued]  = useState<Set<string>>(new Set())
  const [modalState,       setModalState]       = useState<{ photos: GridPhoto[]; index: number } | null>(null)

  const wmPresetsLoaded = useRef(initialWatermarkPresets.length > 0)
  const lastClickedId   = useRef<string | null>(null)

  // ── Drag-select state ─────────────────────────────────────────────────────
  const [selRect,   setSelRect]   = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  const photoNodes    = useRef<Map<string, HTMLDivElement>>(new Map())
  const suppressClick = useRef(false)
  const dragSel       = useRef<{
    el:        HTMLDivElement
    pointerId: number
    startX:    number; startY: number
    active:    boolean
    additive:  boolean
    preIds:    Set<string>
  } | null>(null)

  // ── Collapse state ────────────────────────────────────────────────────────
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = sessionStorage.getItem(`frame_collapsed_${galleryId}`)
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
    } catch { return new Set() }
  })

  function saveCollapsed(next: Set<string>) {
    try { sessionStorage.setItem(`frame_collapsed_${galleryId}`, JSON.stringify([...next])) } catch {}
  }

  function toggleSectionCollapse(sectionId: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId)
      saveCollapsed(next)
      return next
    })
  }

  function collapseAllSections() {
    const next = new Set(sections.map((s) => s.id))
    setCollapsedSections(next)
    saveCollapsed(next)
  }

  function expandAllSections() {
    setCollapsedSections(new Set())
    saveCollapsed(new Set())
  }

  // ── Reorder state ─────────────────────────────────────────────────────────
  const [deletingSection,  setDeletingSection]  = useState<{ id: string; title: string } | null>(null)
  const [reorderMode,      setReorderMode]      = useState(false)
  const [loadingAll,       setLoadingAll]       = useState(false)
  const [dragPhotoId,      setDragPhotoId]      = useState<string | null>(null)
  const [dragOverPhotoId,  setDragOverPhotoId]  = useState<string | null>(null)
  const [dragInsertBefore, setDragInsertBefore] = useState(true)
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const dropdownNodes  = useRef<Map<string, HTMLDivElement>>(new Map())
  const isFirstRender  = useRef(true)

  // ── Close dropdowns ───────────────────────────────────────────────────────

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (openDropdown === null) return
      const node = dropdownNodes.current.get(openDropdown)
      if (!node || !node.contains(e.target as Node)) setOpenDropdown(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openDropdown])

  // ── Escape to clear selection ─────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !modalState) {
        setSelectedIds(new Set())
        lastClickedId.current = null
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalState])

  // ── Build query string ────────────────────────────────────────────────────

  const buildQuery = useCallback((f: PhotoFilters, p: number) => {
    const sp = new URLSearchParams({ dashboard: '1', page: String(p) })
    if (f.q)              sp.set('q', f.q)
    if (f.status)         sp.set('status', f.status)
    if (f.sectionId)      sp.set('sectionId', f.sectionId)
    if (f.sort)           sp.set('sort', f.sort)
    if (f.clientSelected) sp.set('clientSelected', 'true')
    if (f.hasComments)    sp.set('hasComments', 'true')
    if (f.hasFinal)       sp.set('hasFinal', 'true')
    if (f.labels.length)  sp.set('labels', f.labels.join(','))
    return sp.toString()
  }, [])

  // ── Fetch when filters change ─────────────────────────────────────────────

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }

    let cancelled = false
    setIsLoading(true)
    setPage(1)
    setSelectedIds(new Set())
    lastClickedId.current = null

    fetch(`/api/galleries/${galleryId}/photos?${buildQuery(filters, 1)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setPhotos(data.photos ?? [])
        setTotal(data.total   ?? 0)
        setHasMore(data.hasMore ?? false)
        if (data.allLabels?.length) setAllLabels(data.allLabels)
      })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [filters, galleryId, buildQuery])

  // ── Load more ─────────────────────────────────────────────────────────────

  async function loadMore() {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const nextPage = page + 1
    try {
      const res  = await fetch(`/api/galleries/${galleryId}/photos?${buildQuery(filters, nextPage)}`)
      const data = await res.json()
      setPhotos((prev) => [...prev, ...(data.photos ?? [])])
      setHasMore(data.hasMore ?? false)
      setPage(nextPage)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  /** Flat ordered list of ready photos matching current render order */
  function getFlatReadyPhotos(): GridPhoto[] {
    const result: GridPhoto[] = []
    if (isFiltered) return photos.filter((p) => p.status === 'ready')
    for (const s of sections) result.push(...photos.filter((p) => p.sectionId === s.id && p.status === 'ready'))
    result.push(...photos.filter((p) => p.sectionId === null && p.status === 'ready'))
    return result
  }

  function clearSelection() {
    setSelectedIds(new Set())
    lastClickedId.current = null
  }

  function registerPhotoNode(el: HTMLDivElement | null, id: string) {
    if (el) photoNodes.current.set(id, el)
    else    photoNodes.current.delete(id)
  }

  // ── Drag-select handlers ──────────────────────────────────────────────────

  function onGridPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Only mouse; let touch scroll naturally
    if (e.pointerType !== 'mouse') return
    // Only left button; not while reordering or modal open
    if (e.button !== 0 || reorderMode || modalState) return
    // Skip if starting on an interactive element
    if ((e.target as HTMLElement).closest('button, a, input, select')) return

    suppressClick.current = false
    dragSel.current = {
      el:        e.currentTarget,
      pointerId: e.pointerId,
      startX:    e.clientX,
      startY:    e.clientY,
      active:    false,
      additive:  e.shiftKey || e.metaKey || e.ctrlKey,
      preIds:    (e.shiftKey || e.metaKey || e.ctrlKey) ? new Set(selectedIds) : new Set(),
    }
    // Do NOT setPointerCapture here — that would steal click-event synthesis
    // from the photo elements. Capture is set lazily in onGridPointerMove once
    // the drag threshold is crossed.
  }

  function onGridPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const ds = dragSel.current
    if (!ds) return
    const dx = e.clientX - ds.startX
    const dy = e.clientY - ds.startY
    if (Math.hypot(dx, dy) < 8) return  // below threshold — treat as click

    if (!ds.active) {
      // First frame past the threshold — enter drag mode and capture so
      // events keep firing even when the pointer leaves the grid bounds
      ds.active = true
      suppressClick.current = true
      ds.el.setPointerCapture(ds.pointerId)
    }

    const left   = Math.min(ds.startX, e.clientX)
    const top    = Math.min(ds.startY, e.clientY)
    const width  = Math.abs(dx)
    const height = Math.abs(dy)
    setSelRect({ left, top, width, height })

    // Intersect each photo node with the rectangle (viewport coords)
    const rL = left, rR = left + width, rT = top, rB = top + height
    const dragged = new Set<string>()
    for (const [id, el] of photoNodes.current) {
      const r = el.getBoundingClientRect()
      if (r.right > rL && r.left < rR && r.bottom > rT && r.top < rB) dragged.add(id)
    }

    setSelectedIds(ds.additive ? new Set([...ds.preIds, ...dragged]) : dragged)
  }

  function onGridPointerUp() {
    const ds = dragSel.current
    dragSel.current = null
    setSelRect(null)
    if (!ds?.active) {
      // Was a plain click (threshold not crossed) — let PhotoThumb.onClick handle it
      suppressClick.current = false
    }
    // If ds.active: capture was set, click fires on the grid not the photo,
    // so PhotoThumb.onClick won't fire anyway — suppressClick is a belt-and-suspenders
  }

  function handleToggleSelect(id: string, e: React.MouseEvent) {
    const flat = getFlatReadyPhotos()

    if (e.shiftKey && lastClickedId.current) {
      // Range select
      const from = flat.findIndex((p) => p.id === lastClickedId.current)
      const to   = flat.findIndex((p) => p.id === id)
      if (from !== -1 && to !== -1) {
        const [start, end] = from < to ? [from, to] : [to, from]
        const rangeIds = flat.slice(start, end + 1).map((p) => p.id)
        setSelectedIds((prev) => {
          const n = new Set(prev)
          rangeIds.forEach((rid) => n.add(rid))
          return n
        })
        lastClickedId.current = id
        return
      }
    }

    // Ctrl/Cmd or plain click — toggle individual
    lastClickedId.current = id
    setSelectedIds((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  function openModal(photoId: string) {
    const flat = getFlatReadyPhotos()
    const idx  = flat.findIndex((p) => p.id === photoId)
    if (idx === -1) return
    setModalState({ photos: flat, index: idx })
  }

  // ── Section CRUD ──────────────────────────────────────────────────────────


  async function handleAssign(photoId: string, sectionId: string | null) {
    setOpenDropdown(null)
    setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, sectionId } : p))
    await fetch(`/api/photos/${photoId}/section`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ sectionId }),
    })
  }

  async function handleBulkMove(sectionId: string | null) {
    const ids = [...selectedIds]
    setPhotos((prev) => prev.map((p) => selectedIds.has(p.id) ? { ...p, sectionId } : p))
    clearSelection()
    await Promise.all(ids.map((id) =>
      fetch(`/api/photos/${id}/section`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ sectionId }),
      }),
    ))
  }

  function registerDropdownAnchor(el: HTMLDivElement | null, photoId: string) {
    if (el) dropdownNodes.current.set(photoId, el)
    else    dropdownNodes.current.delete(photoId)
  }

  // ── Context menu ──────────────────────────────────────────────────────────

  async function openContextMenu(e: React.MouseEvent, photo: GridPhoto) {
    e.stopPropagation()
    setContextMenu({ photo, x: e.clientX, y: e.clientY })
    if (!wmPresetsLoaded.current) {
      wmPresetsLoaded.current = true
      try {
        const res  = await fetch('/api/watermarks')
        const data = await res.json()
        if (data.presets) setWatermarkPresets(data.presets)
      } catch { /* non-critical */ }
    }
  }

  function handlePhotoUpdated(photoId: string, patch: Partial<GridPhoto & { watermarkQueued?: boolean }>) {
    const { watermarkQueued: wq, ...photoPatch } = patch
    setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, ...photoPatch } : p))
    if (wq) {
      setWatermarkQueued((prev) => new Set(prev).add(photoId))
      setTimeout(() => {
        setWatermarkQueued((prev) => { const n = new Set(prev); n.delete(photoId); return n })
      }, 15_000)
    }
  }

  function handlePhotoDeleted(photoId: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    setTotal((t) => Math.max(0, t - 1))
  }

  // ── Bulk watermark ────────────────────────────────────────────────────────

  async function handleBulkWatermark(presetId: string | null, remove = false) {
    const ids = [...selectedIds]
    clearSelection()
    setWatermarkQueued((prev) => { const n = new Set(prev); ids.forEach((id) => n.add(id)); return n })
    await fetch('/api/photos/bulk', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'apply_watermark', photoIds: ids, presetId, remove }),
    })
    setTimeout(() => {
      setWatermarkQueued((prev) => { const n = new Set(prev); ids.forEach((id) => n.delete(id)); return n })
    }, 15_000)
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    const ids = [...selectedIds]
    clearSelection()
    setPhotos((prev) => prev.filter((p) => !new Set(ids).has(p.id)))
    setTotal((t) => Math.max(0, t - ids.length))
    await fetch('/api/photos/bulk', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'delete', photoIds: ids }),
    })
  }

  // ── Reorder ───────────────────────────────────────────────────────────────

  async function enterReorderMode() {
    if (hasMore) {
      setLoadingAll(true)
      try {
        let allPhotos = [...photos]
        let currentPage = page
        let moreRemaining = hasMore
        while (moreRemaining) {
          currentPage++
          const res  = await fetch(`/api/galleries/${galleryId}/photos?${buildQuery(DEFAULT_FILTERS, currentPage)}`)
          const data = await res.json()
          allPhotos = [...allPhotos, ...(data.photos ?? [])]
          moreRemaining = data.hasMore ?? false
        }
        setPhotos(allPhotos)
        setPage(currentPage)
        setHasMore(false)
      } finally {
        setLoadingAll(false)
      }
    }
    setReorderMode(true)
    clearSelection()
  }

  function exitReorderMode() { setReorderMode(false) }

  function getOrderedIds(currentPhotos: GridPhoto[]): string[] {
    const ids: string[] = []
    for (const s of sections) {
      for (const p of currentPhotos.filter((ph) => ph.sectionId === s.id)) ids.push(p.id)
    }
    for (const p of currentPhotos.filter((ph) => ph.sectionId === null)) ids.push(p.id)
    return ids
  }

  function scheduleReorderSave(newPhotos: GridPhoto[]) {
    clearTimeout(reorderTimer.current)
    reorderTimer.current = setTimeout(async () => {
      const ids = getOrderedIds(newPhotos)
      await fetch(`/api/galleries/${galleryId}/photos/order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ photoIds: ids }),
      })
    }, 600)
  }

  function handleDragStart(e: React.DragEvent, photoId: string) {
    setDragPhotoId(photoId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, photoId: string) {
    e.preventDefault()
    if (!dragPhotoId || photoId === dragPhotoId) return
    setDragOverPhotoId(photoId)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragInsertBefore(e.clientX < rect.left + rect.width / 2)
  }

  function handleDragLeave() { setDragOverPhotoId(null) }
  function handleDragEnd()   { setDragPhotoId(null); setDragOverPhotoId(null) }

  function handleDrop(e: React.DragEvent, targetId: string, groupPhotos: GridPhoto[]) {
    e.preventDefault()
    if (!dragPhotoId || dragPhotoId === targetId) { handleDragEnd(); return }

    const from = groupPhotos.findIndex((p) => p.id === dragPhotoId)
    const to   = groupPhotos.findIndex((p) => p.id === targetId)
    if (from === -1 || to === -1) { handleDragEnd(); return }

    const reordered = [...groupPhotos]
    const [moved]   = reordered.splice(from, 1)
    const insertAt  = dragInsertBefore
      ? (from < to ? to - 1 : to)
      : (from > to ? to + 1 : to)
    reordered.splice(insertAt, 0, moved)

    const groupIds = new Set(groupPhotos.map((p) => p.id))
    let gi = 0
    const newPhotos = photos.map((p) => groupIds.has(p.id) ? reordered[gi++] : p)
    setPhotos(newPhotos)
    handleDragEnd()
    scheduleReorderSave(newPhotos)
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const isFiltered = !!(
    filters.q || filters.status || filters.sectionId || filters.sort ||
    filters.clientSelected || filters.hasComments || filters.hasFinal || filters.labels.length
  )

  const grouped      = sections.map((s) => ({ ...s, photos: photos.filter((p) => p.sectionId === s.id) }))
  const unsectioned  = photos.filter((p) => p.sectionId === null)
  const readyCount   = photos.filter((p) => p.status === 'ready').length
  const pendingCount = photos.filter((p) => p.status === 'processing').length
  const failedCount  = photos.filter((p) => p.status === 'failed').length
  const selCount     = selectedIds.size
  const hasPhotos    = photos.length > 0

  const thumbProps = {
    sections,
    openDropdown,
    onToggleSelect:    handleToggleSelect,
    onOpenModal:       openModal,
    onDropdownToggle:  (id: string) => setOpenDropdown((prev) => prev === id ? null : id),
    onAssign:          handleAssign,
    dropdownAnchor:    registerDropdownAnchor,
    onContextMenu:     openContextMenu,
    onMoreActions:     openContextMenu,
    isClickSuppressed: () => suppressClick.current,
  }

  function renderGrid(gridPhotos: GridPhoto[]) {
    if (gridPhotos.length === 0) return <p className="text-xs font-sans text-stone-400 py-6 italic">No photos</p>
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-2">
        {gridPhotos.map((photo) => (
          <PhotoThumb
            key={photo.id}
            photo={photo}
            isSelected={selectedIds.has(photo.id)}
            watermarkQueued={watermarkQueued.has(photo.id)}
            photoRef={(el) => registerPhotoNode(el, photo.id)}
            {...thumbProps}
          />
        ))}
      </div>
    )
  }

  function renderReorderGrid(groupPhotos: GridPhoto[]) {
    if (groupPhotos.length === 0) return <p className="text-xs font-sans text-stone-400 py-6 italic">No photos</p>
    return (
      <div className="flex flex-wrap gap-2">
        {groupPhotos.map((photo) => {
          const isOver     = dragOverPhotoId === photo.id
          const isDragging = dragPhotoId === photo.id
          return (
            <div
              key={photo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, photo.id)}
              onDragOver={(e)  => handleDragOver(e, photo.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e)      => handleDrop(e, photo.id, groupPhotos)}
              onDragEnd={handleDragEnd}
              className="relative shrink-0 cursor-grab active:cursor-grabbing select-none"
              style={{
                width: 128,
                opacity: isDragging ? 0.4 : 1,
                outline: isOver ? '2px solid #C9A96E' : '2px solid transparent',
                outlineOffset: '-2px',
                boxShadow: isOver
                  ? dragInsertBefore ? 'inset 3px 0 0 #C9A96E' : 'inset -3px 0 0 #C9A96E'
                  : 'none',
                transition: 'opacity 150ms, box-shadow 80ms',
              }}
            >
              <div className="w-full bg-stone-100" style={{ aspectRatio: '3/2' }}>
                {photo.thumbnailUrl && (
                  <img src={photo.thumbnailUrl} alt={photo.filename} draggable={false} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <GripVertical size={20} strokeWidth={1.5} className="text-white drop-shadow" />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onPointerDown={onGridPointerDown}
      onPointerMove={onGridPointerMove}
      onPointerUp={onGridPointerUp}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {selCount > 0 ? (
            <>
              <span className="text-sm font-sans text-stone-700">{selCount} selected</span>
              <BulkMoveDropdown sections={sections} onMove={handleBulkMove} />
              <BulkWatermarkDropdown
                presets={watermarkPresets}
                onApply={(presetId, remove) => handleBulkWatermark(presetId, remove)}
              />
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 text-xs font-sans text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 size={11} strokeWidth={1.5} />
                Delete
              </button>
              <button onClick={clearSelection} className="text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors">
                Clear
              </button>
            </>
          ) : (
            <h2 className="text-xs font-sans text-stone-400 uppercase tracking-widest">
              Photos
              {readyCount   > 0 && <span className="text-stone-600 ml-1">{readyCount}</span>}
              {pendingCount > 0 && <span className="text-amber-500 ml-2 normal-case tracking-normal">{pendingCount} processing</span>}
              {failedCount  > 0 && <span className="text-red-400 ml-2 normal-case tracking-normal">{failedCount} failed</span>}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-3">
          {sections.length > 0 && !isFiltered && !reorderMode && (
            <>
              <button
                onClick={expandAllSections}
                className="text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
              >
                Expand all
              </button>
              <button
                onClick={collapseAllSections}
                className="text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
              >
                Collapse all
              </button>
            </>
          )}
          {hasPhotos && !isFiltered && !reorderMode && (
            <button
              onClick={() => { if (reorderMode) exitReorderMode(); else enterReorderMode() }}
              disabled={loadingAll}
              className={`flex items-center gap-1.5 text-xs font-sans transition-colors disabled:opacity-40 ${reorderMode ? 'text-stone-700' : 'text-stone-400 hover:text-stone-700'}`}
            >
              <GripVertical size={12} strokeWidth={1.5} />
              {loadingAll ? 'Loading…' : 'Reorder'}
            </button>
          )}
          {reorderMode && (
            <button
              onClick={exitReorderMode}
              className="flex items-center gap-1.5 text-xs font-sans text-stone-700 transition-colors"
            >
              Done reordering
            </button>
          )}
          {!reorderMode && (
            <button onClick={() => setSectionDialog({ mode: 'new' })} className="flex items-center gap-1.5 text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors">
              <Plus size={12} strokeWidth={1.5} />
              New section
            </button>
          )}
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <PhotoFilterBar
        filters={filters}
        sections={sections}
        allLabels={allLabels}
        total={total}
        isLoading={isLoading}
        onChange={setFilters}
      />


      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={18} strokeWidth={1.5} className="text-stone-400 animate-spin" />
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      {!isLoading && (
        <>
          {isFiltered ? (
            photos.length > 0
              ? renderGrid(photos)
              : <p className="text-sm font-sans text-stone-400 py-16 text-center italic">No photos match your filters</p>
          ) : (
            <>
              {grouped.map((section) => {
                const isCollapsed = collapsedSections.has(section.id)
                return (
                  <div key={section.id} className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => toggleSectionCollapse(section.id)}
                        aria-expanded={!isCollapsed}
                        aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
                        className="shrink-0 text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        {isCollapsed
                          ? <ChevronRight size={14} strokeWidth={1.5} />
                          : <ChevronDown  size={14} strokeWidth={1.5} />
                        }
                      </button>
                      <h3 className="text-sm font-sans font-medium text-stone-700">{section.title}</h3>
                      {isCollapsed && section.photos.length > 0 && (
                        <span className="text-[11px] font-sans text-stone-400 tabular-nums">
                          {section.photos.length}
                        </span>
                      )}
                      <span className={`text-[10px] font-sans px-1.5 py-0.5 border leading-none ${
                        section.visibleToClient
                          ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                          : 'text-stone-400 border-stone-200 bg-stone-50'
                      }`}>
                        {section.visibleToClient ? 'Visible' : 'Hidden'}
                      </span>
                      {!reorderMode && (
                        <div className="ml-auto flex items-center gap-3">
                          <button
                            onClick={() => setSectionDialog({ mode: 'edit', section })}
                            className="text-stone-300 hover:text-stone-600 transition-colors"
                            aria-label="Edit section"
                          >
                            <Pencil size={12} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => setDeletingSection({ id: section.id, title: section.title })}
                            className="flex items-center gap-1 text-xs font-sans text-stone-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} strokeWidth={1.5} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                    {!isCollapsed && (
                      reorderMode ? renderReorderGrid(section.photos) : renderGrid(section.photos)
                    )}
                  </div>
                )
              })}

              {unsectioned.length > 0 && (
                <div className={sections.length > 0 ? 'mt-10' : ''}>
                  {sections.length > 0 && <h3 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-4">Other</h3>}
                  {reorderMode ? renderReorderGrid(unsectioned) : renderGrid(unsectioned)}
                </div>
              )}

              {!hasPhotos && sections.length === 0 && (
                <p className="text-sm text-stone-400 font-sans py-16 text-center">No photos yet</p>
              )}
            </>
          )}

          {/* ── Load more ─────────────────────────────────────────────────── */}
          {hasMore && (
            <div className="flex items-center justify-center pt-10">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-sans border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors disabled:opacity-40"
              >
                {isLoadingMore
                  ? <><Loader2 size={12} strokeWidth={1.5} className="animate-spin" /> Loading…</>
                  : `Load more · ${total - photos.length} remaining`
                }
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Context menu ─────────────────────────────────────────────────── */}
      {contextMenu && (
        <PhotoContextMenu
          galleryId={galleryId}
          photo={contextMenu.photo}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          sections={sections}
          watermarkPresets={watermarkPresets}
          onClose={() => setContextMenu(null)}
          onUpdated={handlePhotoUpdated}
          onDeleted={handlePhotoDeleted}
          onCoverSet={() => setContextMenu(null)}
        />
      )}

      {/* ── Photo modal ───────────────────────────────────────────────────── */}
      {modalState && (
        <DashboardPhotoModal
          photos={modalState.photos}
          initialIndex={modalState.index}
          selectedIds={selectedIds}
          onClose={() => setModalState(null)}
          onToggleSelect={(id) => {
            lastClickedId.current = id
            setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
          }}
        />
      )}

      {/* ── Drag-select rectangle ─────────────────────────────────────────── */}
      {selRect && (
        <div
          className="fixed pointer-events-none z-40"
          style={{
            left:            selRect.left,
            top:             selRect.top,
            width:           selRect.width,
            height:          selRect.height,
            backgroundColor: 'rgba(201,169,110,0.07)',
            border:          '1px solid rgba(201,169,110,0.40)',
          }}
        />
      )}

      {deletingSection && (
        <DeleteSectionDialog
          section={deletingSection}
          galleryId={galleryId}
          onClose={() => setDeletingSection(null)}
          onDeleted={(id) => {
            setSections((prev) => prev.filter((s) => s.id !== id))
            setPhotos((prev) => prev.map((p) => p.sectionId === id ? { ...p, sectionId: null } : p))
          }}
        />
      )}

      {sectionDialog && (
        <SectionDialog
          galleryId={galleryId}
          section={sectionDialog.mode === 'edit' ? sectionDialog.section : null}
          onClose={() => setSectionDialog(null)}
          onSaved={(saved: SectionRecord) => {
            if (sectionDialog.mode === 'new') {
              setSections((prev) => [...prev, saved])
            } else {
              setSections((prev) => prev.map((s) => s.id === saved.id ? saved : s))
            }
          }}
        />
      )}
    </div>
  )
}
