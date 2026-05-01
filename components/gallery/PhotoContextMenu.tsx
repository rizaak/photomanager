'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Image, Droplets, X, ChevronRight, Tag, Pencil,
  CheckCircle2, Trash2, Loader2, Check,
} from 'lucide-react'
import type { GridPhoto, GridSection } from './DashboardPhotoGrid'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WatermarkPresetOption {
  id:        string
  name:      string
  previewUrl: string
}

interface Props {
  galleryId:        string
  photo:            GridPhoto
  position:         { x: number; y: number }
  sections:         GridSection[]
  watermarkPresets: WatermarkPresetOption[]
  onClose:          () => void
  onUpdated:        (photoId: string, patch: Partial<GridPhoto & { watermarkQueued?: boolean }>) => void
  onDeleted:        (photoId: string) => void
  onCoverSet:       (photoId: string) => void
}

type Panel = 'watermark' | 'section' | 'tags' | null

// ── PhotoContextMenu ──────────────────────────────────────────────────────────

export function PhotoContextMenu({
  galleryId, photo, position, sections, watermarkPresets,
  onClose, onUpdated, onDeleted, onCoverSet,
}: Props) {
  const [panel,        setPanel]        = useState<Panel>(null)
  const [tagInput,     setTagInput]     = useState('')
  const [localLabels,  setLocalLabels]  = useState(photo.labels ?? [])
  const [busyAction,   setBusyAction]   = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef  = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ top: position.y, left: position.x })

  // ── Position adjustment ────────────────────────────────────────────────────

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const rect = menu.getBoundingClientRect()
    let { x, y } = position
    if (x + rect.width  > window.innerWidth  - 8) x = window.innerWidth  - rect.width  - 8
    if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8
    if (x < 8) x = 8
    if (y < 8) y = 8
    setCoords({ top: y, left: x })
  }, [position, panel])

  // ── Close on outside click / Escape ───────────────────────────────────────

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown',   onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown',   onKeyDown)
    }
  }, [onClose])

  // ── Helpers ────────────────────────────────────────────────────────────────

  async function run(key: string, fn: () => Promise<void>) {
    setBusyAction(key)
    try { await fn() } finally { setBusyAction(null) }
  }

  function isBusy(key: string) { return busyAction === key }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleSetCover() {
    await run('cover', async () => {
      await fetch(`/api/galleries/${galleryId}/settings`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ coverPhotoId: photo.id }),
      })
      onCoverSet(photo.id)
      onClose()
    })
  }

  async function handleWatermark(presetId?: string | null, remove = false) {
    await run('wm', async () => {
      await fetch(`/api/photos/${photo.id}/watermark`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ presetId: presetId ?? null, remove }),
      })
      onUpdated(photo.id, { watermarkQueued: true })
      setPanel(null)
      onClose()
    })
  }

  async function handleMoveSection(sectionId: string | null) {
    await run('section', async () => {
      await fetch(`/api/photos/${photo.id}/section`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sectionId }),
      })
      onUpdated(photo.id, { sectionId })
      setPanel(null)
      onClose()
    })
  }

  async function handleEditStatus(editStatus: string) {
    await run(editStatus, async () => {
      await fetch(`/api/photos/${photo.id}/edit-status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ editStatus }),
      })
      onUpdated(photo.id, { editStatus })
      onClose()
    })
  }

  async function handleSaveTags() {
    await run('tags', async () => {
      await fetch(`/api/photos/${photo.id}/labels`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ labels: localLabels }),
      })
      onUpdated(photo.id, { labels: localLabels })
      setPanel(null)
      onClose()
    })
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '')
    if (!tag || localLabels.includes(tag) || localLabels.length >= 20) return
    setLocalLabels((prev) => [...prev, tag])
    setTagInput('')
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await run('delete', async () => {
      await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' })
      onDeleted(photo.id)
      onClose()
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const currentSectionName = sections.find((s) => s.id === photo.sectionId)?.title ?? 'No section'

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Photo actions"
      style={{ top: coords.top, left: coords.left }}
      className="fixed z-[9999] w-56 bg-white border border-stone-200 shadow-2xl shadow-black/10 py-1 text-sm font-sans focus:outline-none"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-stone-100 mb-1">
        <p className="text-[10px] font-sans text-stone-400 uppercase tracking-widest truncate">
          {photo.filename}
        </p>
      </div>

      {/* Set as cover */}
      <MenuItem
        icon={<Image size={12} strokeWidth={1.5} />}
        label="Set as cover photo"
        busy={isBusy('cover')}
        onClick={handleSetCover}
      />

      <Divider />

      {/* Apply watermark */}
      <MenuItem
        icon={<Droplets size={12} strokeWidth={1.5} />}
        label="Apply watermark"
        hasPanel
        panelOpen={panel === 'watermark'}
        onClick={() => setPanel(panel === 'watermark' ? null : 'watermark')}
      />
      {panel === 'watermark' && (
        <SubPanel>
          <SubItem
            label="Default watermark"
            active={!photo.appliedWatermarkPresetId}
            onClick={() => handleWatermark(null)}
          />
          {watermarkPresets.map((p) => (
            <SubItem
              key={p.id}
              label={p.name}
              active={photo.appliedWatermarkPresetId === p.id}
              onClick={() => handleWatermark(p.id)}
            />
          ))}
          {watermarkPresets.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-stone-400">No presets — using default</p>
          )}
        </SubPanel>
      )}

      <MenuItem
        icon={<X size={12} strokeWidth={1.5} />}
        label="Remove watermark"
        busy={isBusy('wm') && panel !== 'watermark'}
        onClick={() => handleWatermark(null, true)}
      />

      <Divider />

      {/* Move to section */}
      <MenuItem
        icon={<ChevronRight size={12} strokeWidth={1.5} />}
        label="Move to section"
        hint={currentSectionName}
        hasPanel
        panelOpen={panel === 'section'}
        onClick={() => setPanel(panel === 'section' ? null : 'section')}
      />
      {panel === 'section' && (
        <SubPanel>
          <SubItem
            label="No section"
            active={photo.sectionId === null}
            onClick={() => handleMoveSection(null)}
          />
          {sections.map((s) => (
            <SubItem
              key={s.id}
              label={s.title}
              active={photo.sectionId === s.id}
              onClick={() => handleMoveSection(s.id)}
            />
          ))}
        </SubPanel>
      )}

      <Divider />

      {/* Tags */}
      <MenuItem
        icon={<Tag size={12} strokeWidth={1.5} />}
        label="Edit tags"
        hasPanel
        panelOpen={panel === 'tags'}
        onClick={() => setPanel(panel === 'tags' ? null : 'tags')}
      />
      {panel === 'tags' && (
        <SubPanel>
          {/* Current tags */}
          <div className="px-3 pt-1 pb-2 flex flex-wrap gap-1">
            {localLabels.length === 0 && (
              <span className="text-[11px] text-stone-300">No tags yet</span>
            )}
            {localLabels.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-stone-100 text-[10px] text-stone-600"
              >
                #{tag}
                <button
                  onClick={() => setLocalLabels((prev) => prev.filter((t) => t !== tag))}
                  className="text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <X size={8} strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
          {/* Add tag input */}
          <div className="px-3 pb-2 flex gap-1.5">
            <input
              autoFocus
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTag() }}
              placeholder="Add tag…"
              maxLength={30}
              className="flex-1 border border-stone-200 px-2 py-1 text-[11px] font-sans text-stone-700 focus:outline-none focus:border-stone-400"
            />
            <button
              onClick={handleSaveTags}
              disabled={isBusy('tags')}
              className="px-2 py-1 bg-stone-900 text-white text-[10px] disabled:opacity-40 hover:bg-stone-800 transition-colors"
            >
              {isBusy('tags') ? <Loader2 size={10} className="animate-spin" /> : 'Save'}
            </button>
          </div>
        </SubPanel>
      )}

      <Divider />

      {/* Edit status */}
      <MenuItem
        icon={<Pencil size={12} strokeWidth={1.5} />}
        label="Mark as editing"
        active={photo.editStatus === 'EDITING'}
        busy={isBusy('EDITING')}
        onClick={() => handleEditStatus('EDITING')}
      />
      <MenuItem
        icon={<CheckCircle2 size={12} strokeWidth={1.5} />}
        label="Mark as final ready"
        active={photo.editStatus === 'FINAL_READY'}
        busy={isBusy('FINAL_READY')}
        onClick={() => handleEditStatus('FINAL_READY')}
      />

      <Divider />

      {/* Delete */}
      {confirmDelete ? (
        <div className="px-3 py-2">
          <p className="text-[11px] text-stone-600 mb-2">Delete this photo? This cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isBusy('delete')}
              className="flex-1 py-1.5 text-[11px] bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-1"
            >
              {isBusy('delete') ? <Loader2 size={10} className="animate-spin" /> : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 text-[11px] border border-stone-200 text-stone-600 hover:border-stone-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <MenuItem
          icon={<Trash2 size={12} strokeWidth={1.5} />}
          label="Delete photo"
          destructive
          onClick={handleDelete}
        />
      )}
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(menu, document.body) : null
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MenuItem({
  icon, label, hint, active, busy, destructive, hasPanel, panelOpen, onClick,
}: {
  icon:       React.ReactNode
  label:      string
  hint?:      string
  active?:    boolean
  busy?:      boolean
  destructive?: boolean
  hasPanel?:  boolean
  panelOpen?: boolean
  onClick:    () => void
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors ${
        destructive
          ? 'text-red-500 hover:bg-red-50'
          : active
          ? 'text-stone-900 bg-stone-50'
          : 'text-stone-700 hover:bg-stone-50'
      }`}
    >
      <span className={`shrink-0 ${active ? 'text-stone-900' : destructive ? 'text-red-400' : 'text-stone-400'}`}>
        {busy ? <Loader2 size={12} strokeWidth={1.5} className="animate-spin" /> : icon}
      </span>
      <span className="flex-1 text-xs">{label}</span>
      {hint && <span className="text-[10px] text-stone-400 truncate max-w-[60px]">{hint}</span>}
      {active && !busy && <Check size={10} strokeWidth={2.5} className="text-stone-700 shrink-0" />}
      {hasPanel && <span className="text-stone-300 text-[10px] shrink-0">{panelOpen ? '▲' : '▼'}</span>}
    </button>
  )
}

function SubPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-3 mb-1 border-l-2 border-stone-100 pl-2 py-0.5">
      {children}
    </div>
  )
}

function SubItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-stone-50 transition-colors"
    >
      <span className="w-3 shrink-0">
        {active && <Check size={10} strokeWidth={2.5} className="text-stone-700" />}
      </span>
      <span className={`text-xs font-sans ${active ? 'text-stone-900 font-medium' : 'text-stone-600'}`}>{label}</span>
    </button>
  )
}

function Divider() {
  return <div className="my-1 border-t border-stone-100 mx-1" />
}
