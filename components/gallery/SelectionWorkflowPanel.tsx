'use client'

import { useRef, useState } from 'react'
import { Check, ChevronDown, Upload } from 'lucide-react'
import type { WorkflowData, WorkflowState, PhotoEditStatus } from '@/src/modules/selections/services/WorkflowService'

// ── Constants ──────────────────────────────────────────────────────────────────

const WORKFLOW_LABELS: Record<WorkflowState, string> = {
  IN_PROGRESS:         'In Progress',
  COMPLETED_BY_CLIENT: 'Submitted by Client',
  IN_REVIEW:           'In Review',
  EDITING:             'Editing',
  DELIVERED:           'Delivered',
}

const WORKFLOW_NEXT: Partial<Record<WorkflowState, { label: string; state: WorkflowState }>> = {
  COMPLETED_BY_CLIENT: { label: 'Mark as In Review', state: 'IN_REVIEW'  },
  IN_REVIEW:           { label: 'Start Editing',      state: 'EDITING'   },
  EDITING:             { label: 'Mark as Delivered',  state: 'DELIVERED' },
}

const WORKFLOW_COLOR: Record<WorkflowState, string> = {
  IN_PROGRESS:         'text-stone-500  bg-stone-100',
  COMPLETED_BY_CLIENT: 'text-amber-700  bg-amber-50',
  IN_REVIEW:           'text-amber-700  bg-amber-50',
  EDITING:             'text-blue-700   bg-blue-50',
  DELIVERED:           'text-stone-800  bg-stone-100',
}

const EDIT_LABELS: Record<PhotoEditStatus, string> = {
  NONE:        '',
  EDITING:     'Editing',
  FINAL_READY: 'Final',
}

// ── EditStatusBadge ────────────────────────────────────────────────────────────

function EditStatusBadge({ status, hasFinal }: { status: PhotoEditStatus; hasFinal: boolean }) {
  if (status === 'NONE') return null
  const isF = status === 'FINAL_READY'
  return (
    <span
      className={`absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-sans font-medium leading-none ${
        isF ? 'text-stone-950' : 'text-stone-700 bg-white/80'
      }`}
      style={isF ? { backgroundColor: hasFinal ? '#C9A96E' : '#d6bcfa' } : {}}
    >
      {isF && hasFinal && <Check size={8} strokeWidth={2.5} />}
      {EDIT_LABELS[status]}
    </span>
  )
}

// ── BulkEditDropdown ───────────────────────────────────────────────────────────

interface BulkEditDropdownProps {
  onMark: (status: PhotoEditStatus) => void
}

function BulkEditDropdown({ onMark }: BulkEditDropdownProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-sans text-stone-700 border border-stone-300 hover:border-stone-400 transition-colors"
      >
        Mark as
        <ChevronDown size={11} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 shadow-xl min-w-[140px] z-30">
          {(['EDITING', 'FINAL_READY', 'NONE'] as PhotoEditStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => { setOpen(false); onMark(s) }}
              className="w-full flex items-center px-3 py-2.5 text-xs font-sans text-stone-700 hover:bg-stone-50 transition-colors text-left"
            >
              {s === 'NONE' ? 'None (reset)' : EDIT_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── UploadFinalButton ──────────────────────────────────────────────────────────

interface UploadFinalButtonProps {
  photoId:    string
  galleryId:  string
  onSuccess:  (photoId: string) => void
}

function UploadFinalButton({ photoId, galleryId: _galleryId, onSuccess }: UploadFinalButtonProps) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')

  async function handleFile(file: File) {
    setState('uploading')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(`/api/photos/${photoId}/final`, { method: 'POST', body: form })
      if (res.ok) {
        setState('done')
        onSuccess(photoId)
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  if (state === 'done') return null // badge on photo takes over

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={state === 'uploading'}
        title={state === 'error' ? 'Upload failed — retry' : 'Upload final version'}
        className={`absolute bottom-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-sm transition-colors ${
          state === 'error'
            ? 'bg-red-500/90 text-white'
            : 'bg-black/50 text-white hover:bg-black/70'
        }`}
      >
        {state === 'uploading'
          ? <span className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
          : <Upload size={10} strokeWidth={2} />
        }
      </button>
    </>
  )
}

// ── PhotoThumb ─────────────────────────────────────────────────────────────────

interface PhotoThumbProps {
  photo:       WorkflowData['photos'][number]
  isSelected:  boolean
  galleryId:   string
  onToggle:    (id: string) => void
  onFinalUploaded: (id: string) => void
}

function PhotoThumb({ photo, isSelected, galleryId, onToggle, onFinalUploaded }: PhotoThumbProps) {
  const showUpload = !photo.hasFinal

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(photo.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(photo.id) } }}
      className="relative aspect-[3/2] overflow-hidden bg-stone-100 focus:outline-none group cursor-pointer"
      style={isSelected ? { boxShadow: 'inset 0 0 0 2px #C9A96E' } : {}}
    >
      {photo.thumbnailUrl && (
        <img
          src={photo.thumbnailUrl}
          alt={photo.filename}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover opacity-0"
          style={{ transition: 'opacity 400ms ease' }}
          onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
        />
      )}

      <EditStatusBadge status={photo.editStatus} hasFinal={photo.hasFinal} />

      {/* Selection check */}
      {isSelected && (
        <div
          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#C9A96E' }}
        >
          <Check size={9} strokeWidth={2.5} className="text-stone-950" />
        </div>
      )}

      {/* Upload final button — shown on hover when no final exists */}
      {showUpload && (
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <UploadFinalButton
            photoId={photo.id}
            galleryId={galleryId}
            onSuccess={onFinalUploaded}
          />
        </div>
      )}
    </div>
  )
}

// ── SelectionWorkflowPanel ─────────────────────────────────────────────────────

interface SelectionWorkflowPanelProps {
  galleryId:   string
  initialData: WorkflowData
}

export function SelectionWorkflowPanel({ galleryId, initialData }: SelectionWorkflowPanelProps) {
  const [data,        setData]        = useState(initialData)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [advancing,   setAdvancing]   = useState(false)

  const submittedDate = new Date(data.submittedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const nextStep = WORKFLOW_NEXT[data.workflowState]

  const editingCount   = data.photos.filter((p) => p.editStatus === 'EDITING').length
  const finalCount     = data.photos.filter((p) => p.editStatus === 'FINAL_READY').length
  const withFinalCount = data.photos.filter((p) => p.hasFinal).length

  // ── Workflow advance ─────────────────────────────────────────────────────────

  async function handleAdvance() {
    if (!nextStep || advancing) return
    setAdvancing(true)
    const res = await fetch(`/api/galleries/${galleryId}/selection/workflow`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ state: nextStep.state }),
    })
    if (res.ok) setData((d) => ({ ...d, workflowState: nextStep.state }))
    setAdvancing(false)
  }

  // ── Photo selection ──────────────────────────────────────────────────────────

  function togglePhoto(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll()     { setSelectedIds(new Set(data.photos.map((p) => p.id))) }
  function clearSelection() { setSelectedIds(new Set()) }

  // ── Edit status ──────────────────────────────────────────────────────────────

  async function handleMarkEditStatus(ids: string[], editStatus: PhotoEditStatus) {
    setData((d) => ({
      ...d,
      photos: d.photos.map((p) => ids.includes(p.id) ? { ...p, editStatus } : p),
    }))
    clearSelection()

    await Promise.all(
      ids.map((id) =>
        fetch(`/api/photos/${id}/edit-status`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ editStatus }),
        }),
      ),
    )
  }

  // ── Final uploaded ───────────────────────────────────────────────────────────

  function handleFinalUploaded(photoId: string) {
    setData((d) => ({
      ...d,
      photos: d.photos.map((p) =>
        p.id === photoId ? { ...p, editStatus: 'FINAL_READY' as PhotoEditStatus, hasFinal: true } : p,
      ),
    }))
  }

  const selCount = selectedIds.size

  return (
    <div className="mx-10 mt-6 border border-stone-200 bg-white">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-stone-100">
        <div>
          <p className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-0.5">
            Client Selection
          </p>
          <p className="text-sm font-sans text-stone-700">
            {data.clientName ?? 'Client'} · {data.photoCount} photo{data.photoCount !== 1 ? 's' : ''}
            <span className="text-stone-400 ml-2">submitted {submittedDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {editingCount > 0 && (
            <span className="text-xs font-sans text-blue-600">{editingCount} editing</span>
          )}
          {finalCount > 0 && (
            <span className="text-xs font-sans" style={{ color: '#C9A96E' }}>
              {withFinalCount}/{finalCount} final{finalCount !== 1 ? 's' : ''}
            </span>
          )}

          <span className={`px-2.5 py-1 text-[11px] font-sans font-medium ${WORKFLOW_COLOR[data.workflowState]}`}>
            {WORKFLOW_LABELS[data.workflowState]}
          </span>

          {nextStep && data.workflowState !== 'DELIVERED' && (
            <button
              onClick={handleAdvance}
              disabled={advancing}
              className="px-3 py-1.5 text-xs font-sans bg-stone-900 text-white disabled:opacity-40 transition-opacity hover:bg-stone-800"
            >
              {advancing ? 'Saving…' : nextStep.label + ' →'}
            </button>
          )}
        </div>
      </div>

      {/* ── Photo grid ──────────────────────────────────────────────────────── */}
      <div className="p-6">

        {/* Bulk actions */}
        <div className="flex items-center justify-between mb-4">
          {selCount > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-sans text-stone-700">{selCount} selected</span>
              <BulkEditDropdown onMark={(s) => handleMarkEditStatus([...selectedIds], s)} />
              <button onClick={clearSelection} className="text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors">
                Clear
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={selectAll} className="text-xs font-sans text-stone-400 hover:text-stone-700 transition-colors">
                Select all
              </button>
              {data.workflowState === 'EDITING' && (
                <span className="text-xs font-sans text-stone-400">
                  · Hover a photo to upload its final version
                </span>
              )}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {data.photos.map((photo) => (
            <PhotoThumb
              key={photo.id}
              photo={photo}
              isSelected={selectedIds.has(photo.id)}
              galleryId={galleryId}
              onToggle={togglePhoto}
              onFinalUploaded={handleFinalUploaded}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-100">
          <span className="text-[10px] font-sans text-stone-400 uppercase tracking-widest">Edit status</span>
          <span className="flex items-center gap-1 text-xs font-sans text-stone-500">
            <span className="w-2 h-2 bg-stone-200 rounded-sm" />
            None
          </span>
          <span className="flex items-center gap-1 text-xs font-sans text-stone-500">
            <span className="w-2 h-2 bg-blue-100 rounded-sm border border-blue-200" />
            Editing
          </span>
          <span className="flex items-center gap-1 text-xs font-sans text-stone-500">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#d6bcfa' }} />
            Final (status only)
          </span>
          <span className="flex items-center gap-1 text-xs font-sans text-stone-500">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#C9A96E' }} />
            Final (file uploaded)
          </span>
        </div>
      </div>
    </div>
  )
}
