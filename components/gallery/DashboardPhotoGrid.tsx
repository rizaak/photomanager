'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, ChevronDown, Check, Trash2, Loader2, AlertCircle, MousePointer } from 'lucide-react'

export interface GridSection {
  id: string
  title: string
  sortOrder: number
}

export interface GridPhoto {
  id: string
  filename: string
  width: number
  height: number
  thumbnailUrl: string | null
  sectionId: string | null
  status: 'ready' | 'processing' | 'failed'
}

// ── PhotoThumb ─────────────────────────────────────────────────────────────────

interface PhotoThumbProps {
  photo: GridPhoto
  sections: GridSection[]
  selectMode: boolean
  isSelected: boolean
  openDropdown: string | null
  onToggleSelect: (id: string) => void
  onDropdownToggle: (id: string) => void
  onAssign: (id: string, sectionId: string | null) => void
  dropdownAnchor: (el: HTMLDivElement | null, id: string) => void
}

function PhotoThumb({
  photo, sections, selectMode, isSelected,
  openDropdown, onToggleSelect, onDropdownToggle, onAssign, dropdownAnchor,
}: PhotoThumbProps) {
  const ar = photo.height / photo.width
  const pb = `${Math.min(Math.max(ar * 100, 66), 150)}%`
  const currentSection = sections.find((s) => s.id === photo.sectionId)
  const isOpen = openDropdown === photo.id
  const isReady = photo.status === 'ready'

  function handleClick() {
    if (selectMode && isReady) onToggleSelect(photo.id)
  }

  return (
    <div
      className={`break-inside-avoid relative overflow-hidden bg-stone-100 group ${selectMode && isReady ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="relative w-full" style={{ paddingBottom: pb }}>

        {/* ── Thumbnail (ready) ───────────────────────────────────────────── */}
        {isReady && photo.thumbnailUrl && (
          <img
            src={photo.thumbnailUrl}
            alt={photo.filename}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            style={{ transition: 'opacity 400ms ease' }}
            onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
          />
        )}

        {/* ── Processing placeholder ──────────────────────────────────────── */}
        {photo.status === 'processing' && (
          <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center gap-2">
            <Loader2 size={16} strokeWidth={1.5} className="text-stone-400 animate-spin" />
            <span className="text-[10px] font-sans text-stone-400">Processing</span>
          </div>
        )}

        {/* ── Failed placeholder ──────────────────────────────────────────── */}
        {photo.status === 'failed' && (
          <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center gap-2">
            <AlertCircle size={16} strokeWidth={1.5} className="text-red-400" />
            <span className="text-[10px] font-sans text-red-400">Failed</span>
          </div>
        )}

        {/* ── Selection ring ──────────────────────────────────────────────── */}
        {isSelected && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 0 2px rgba(201,169,110,0.8)' }}
          />
        )}

        {/* ── Select mode checkbox ────────────────────────────────────────── */}
        {selectMode && isReady && (
          <div className="absolute top-1.5 left-1.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                isSelected ? 'bg-accent' : 'bg-black/40 backdrop-blur'
              }`}
              style={isSelected ? { backgroundColor: '#C9A96E' } : {}}
            >
              {isSelected && <Check size={10} strokeWidth={2.5} className="text-stone-950" />}
            </div>
          </div>
        )}

        {/* ── Section badge (normal mode, ready photos only) ──────────────── */}
        {!selectMode && isReady && (
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
                  <button
                    onClick={() => onAssign(photo.id, null)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-sans text-left hover:bg-stone-50 transition-colors"
                  >
                    {photo.sectionId === null
                      ? <Check size={11} strokeWidth={2} className="text-stone-800 shrink-0" />
                      : <span className="w-[11px] shrink-0" />
                    }
                    <span className={photo.sectionId === null ? 'text-stone-800 font-medium' : 'text-stone-500'}>
                      No section
                    </span>
                  </button>
                  {sections.length > 0 && <div className="border-t border-stone-100 mx-3" />}
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onAssign(photo.id, s.id)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-sans text-left hover:bg-stone-50 transition-colors"
                    >
                      {photo.sectionId === s.id
                        ? <Check size={11} strokeWidth={2} className="text-stone-800 shrink-0" />
                        : <span className="w-[11px] shrink-0" />
                      }
                      <span className={photo.sectionId === s.id ? 'text-stone-800 font-medium' : 'text-stone-600'}>
                        {s.title}
                      </span>
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

// ── BulkMoveDropdown ───────────────────────────────────────────────────────────

interface BulkMoveDropdownProps {
  sections: GridSection[]
  onMove: (sectionId: string | null) => void
}

function BulkMoveDropdown({ sections, onMove }: BulkMoveDropdownProps) {
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
        Move to
        <ChevronDown size={11} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 shadow-xl min-w-[150px] z-30">
          <button
            onClick={() => { setOpen(false); onMove(null) }}
            className="w-full flex items-center px-3 py-2.5 text-xs font-sans text-stone-500 hover:bg-stone-50 transition-colors text-left"
          >
            No section
          </button>
          {sections.length > 0 && <div className="border-t border-stone-100 mx-3" />}
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => { setOpen(false); onMove(s.id) }}
              className="w-full flex items-center px-3 py-2.5 text-xs font-sans text-stone-700 hover:bg-stone-50 transition-colors text-left"
            >
              {s.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── DashboardPhotoGrid ─────────────────────────────────────────────────────────

interface DashboardPhotoGridProps {
  galleryId: string
  initialPhotos: GridPhoto[]
  initialSections: GridSection[]
}

export function DashboardPhotoGrid({ galleryId, initialPhotos, initialSections }: DashboardPhotoGridProps) {
  const [sections,      setSections]      = useState(initialSections)
  const [photos,        setPhotos]        = useState(initialPhotos)
  const [addingSection, setAddingSection] = useState(false)
  const [newTitle,      setNewTitle]      = useState('')
  const [creating,      setCreating]      = useState(false)
  const [openDropdown,  setOpenDropdown]  = useState<string | null>(null)
  const [selectMode,    setSelectMode]    = useState(false)
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set())

  const dropdownNodes = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (openDropdown === null) return
      const node = dropdownNodes.current.get(openDropdown)
      if (!node || !node.contains(e.target as Node)) setOpenDropdown(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openDropdown])

  // Exit select mode clears selection
  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  function toggleSelectMode() {
    if (selectMode) { exitSelectMode(); return }
    setSelectMode(true)
  }

  function registerDropdownAnchor(el: HTMLDivElement | null, photoId: string) {
    if (el) dropdownNodes.current.set(photoId, el)
    else    dropdownNodes.current.delete(photoId)
  }

  const grouped     = sections.map((s) => ({ ...s, photos: photos.filter((p) => p.sectionId === s.id) }))
  const unsectioned = photos.filter((p) => p.sectionId === null)
  const readyCount  = photos.filter((p) => p.status === 'ready').length
  const pendingCount = photos.filter((p) => p.status === 'processing').length
  const failedCount  = photos.filter((p) => p.status === 'failed').length

  // ── Section CRUD ───────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!newTitle.trim() || creating) return
    setCreating(true)
    const res = await fetch(`/api/galleries/${galleryId}/sections`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: newTitle.trim() }),
    })
    if (res.ok) {
      const section: GridSection = await res.json()
      setSections((prev) => [...prev, section])
      setNewTitle('')
      setAddingSection(false)
    }
    setCreating(false)
  }

  async function handleDeleteSection(sectionId: string) {
    const res = await fetch(`/api/galleries/${galleryId}/sections/${sectionId}`, { method: 'DELETE' })
    if (res.ok) {
      setSections((prev) => prev.filter((s) => s.id !== sectionId))
      setPhotos((prev) => prev.map((p) => p.sectionId === sectionId ? { ...p, sectionId: null } : p))
    }
  }

  // ── Individual section assignment ──────────────────────────────────────────

  async function handleAssign(photoId: string, sectionId: string | null) {
    setOpenDropdown(null)
    setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, sectionId } : p))
    await fetch(`/api/photos/${photoId}/section`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sectionId }),
    })
  }

  // ── Bulk section assignment ────────────────────────────────────────────────

  async function handleBulkMove(sectionId: string | null) {
    const ids = [...selectedIds]
    setPhotos((prev) => prev.map((p) => selectedIds.has(p.id) ? { ...p, sectionId } : p))
    exitSelectMode()
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/photos/${id}/section`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ sectionId }),
        }),
      ),
    )
  }

  function handleToggleSelect(photoId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else                   next.add(photoId)
      return next
    })
  }

  function handleDropdownToggle(photoId: string) {
    setOpenDropdown((prev) => prev === photoId ? null : photoId)
  }

  const thumbProps = {
    sections, selectMode, openDropdown,
    onToggleSelect: handleToggleSelect,
    onDropdownToggle: handleDropdownToggle,
    onAssign: handleAssign,
    dropdownAnchor: registerDropdownAnchor,
  }

  function renderGrid(gridPhotos: GridPhoto[]) {
    if (gridPhotos.length === 0) {
      return <p className="text-xs font-sans text-stone-400 py-6 italic">No photos</p>
    }
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-2">
        {gridPhotos.map((photo) => (
          <PhotoThumb
            key={photo.id}
            photo={photo}
            isSelected={selectedIds.has(photo.id)}
            {...thumbProps}
          />
        ))}
      </div>
    )
  }

  const hasPhotos    = photos.length > 0
  const selCount     = selectedIds.size

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {selCount > 0 ? (
            <>
              <span className="text-sm font-sans text-stone-700">
                {selCount} selected
              </span>
              <BulkMoveDropdown sections={sections} onMove={handleBulkMove} />
              <button
                onClick={exitSelectMode}
                className="text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
              >
                Clear
              </button>
            </>
          ) : (
            <h2 className="text-xs font-sans text-stone-400 uppercase tracking-widest">
              Photos
              {readyCount > 0 && <span className="text-stone-600 ml-1">{readyCount}</span>}
              {pendingCount > 0 && <span className="text-amber-500 ml-2 normal-case tracking-normal">{pendingCount} processing</span>}
              {failedCount  > 0 && <span className="text-red-400 ml-2 normal-case tracking-normal">{failedCount} failed</span>}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasPhotos && (
            <button
              onClick={toggleSelectMode}
              className={`flex items-center gap-1.5 text-xs font-sans transition-colors ${
                selectMode ? 'text-stone-700' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <MousePointer size={12} strokeWidth={1.5} />
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          )}
          {!addingSection && (
            <button
              onClick={() => setAddingSection(true)}
              className="flex items-center gap-1.5 text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
            >
              <Plus size={12} strokeWidth={1.5} />
              Add section
            </button>
          )}
        </div>
      </div>

      {/* ── New section form ─────────────────────────────────────────────── */}
      {addingSection && (
        <div className="flex items-center gap-2 mb-8">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  handleCreate()
              if (e.key === 'Escape') { setAddingSection(false); setNewTitle('') }
            }}
            placeholder="Section name (e.g. Ceremony, Reception)"
            className="flex-1 border border-stone-200 px-3 py-2 text-sm font-sans text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400"
          />
          <button
            onClick={handleCreate}
            disabled={!newTitle.trim() || creating}
            className="px-4 py-2 text-xs font-sans bg-stone-900 text-white disabled:opacity-40 transition-opacity"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
          <button
            onClick={() => { setAddingSection(false); setNewTitle('') }}
            className="px-4 py-2 text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── Named sections ───────────────────────────────────────────────── */}
      {grouped.map((section) => (
        <div key={section.id} className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-sans font-medium text-stone-700">{section.title}</h3>
            <button
              onClick={() => handleDeleteSection(section.id)}
              className="flex items-center gap-1 text-xs font-sans text-stone-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={12} strokeWidth={1.5} />
              Delete
            </button>
          </div>
          {renderGrid(section.photos)}
        </div>
      ))}

      {/* ── Unsectioned ──────────────────────────────────────────────────── */}
      {unsectioned.length > 0 && (
        <div className={sections.length > 0 ? 'mt-10' : ''}>
          {sections.length > 0 && (
            <h3 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-4">Other</h3>
          )}
          {renderGrid(unsectioned)}
        </div>
      )}

      {/* ── Empty ────────────────────────────────────────────────────────── */}
      {!hasPhotos && sections.length === 0 && (
        <p className="text-sm text-stone-400 font-sans py-16 text-center">No photos yet</p>
      )}
    </div>
  )
}
