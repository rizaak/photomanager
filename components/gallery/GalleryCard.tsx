'use client'

import Link from 'next/link'
import { Download, Link2, Clock, CheckCircle2 } from 'lucide-react'
import type { Gallery, GalleryFolder } from '@/lib/types'
import { getGalleryAction, type GalleryAction } from '@/lib/gallery-utils'
import { GalleryCardMenu } from '@/components/gallery/GalleryCardMenu'

export { getGalleryAction }

const ACTION_META: Record<GalleryAction, {
  label: string
  dot: string
  chip: string   // tailwind classes for the status pill
}> = {
  share:     { label: 'Not shared',       dot: 'bg-stone-300',   chip: 'text-stone-400 bg-stone-50 border-stone-200' },
  awaiting:  { label: 'Awaiting client',  dot: 'bg-stone-400',   chip: 'text-stone-500 bg-stone-50 border-stone-200' },
  selecting: { label: 'Selecting',        dot: 'bg-amber-400',   chip: 'text-amber-700 bg-amber-50 border-amber-200' },
  deliver:   { label: 'Ready to deliver', dot: 'bg-accent',      chip: 'text-[#7a5c10] bg-[#fdf6e8] border-[#e8c96e]' },
  delivered: { label: 'Delivered',        dot: 'bg-emerald-400', chip: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  archived:  { label: 'Archived',         dot: 'bg-stone-300',   chip: 'text-stone-400 bg-stone-50 border-stone-200' },
}

// ── Date helpers ──────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso: string) {
  const [, mm, dd] = iso.split('-')
  return `${MONTHS[parseInt(mm) - 1]} ${parseInt(dd)}`
}

// ── Component ─────────────────────────────────────────────────────────────────
export function GalleryCard({
  gallery,
  folders = [],
  isSelected = false,
  selectionActive = false,
  onSelect,
}: {
  gallery: Gallery
  folders?: GalleryFolder[]
  isSelected?: boolean
  selectionActive?: boolean
  onSelect?: (id: string, e: React.MouseEvent) => void
}) {
  const action = getGalleryAction(gallery)
  const meta = ACTION_META[action]
  const isUrgent = action === 'deliver'

  const selectedCount = gallery.selectedCount ?? 0
  const showProgress = selectedCount > 0 && gallery.status !== 'archived'
  const progressPct = Math.min(100, Math.round((selectedCount / gallery.photoCount) * 100))

  function handleCardClick(e: React.MouseEvent) {
    if (onSelect && (e.metaKey || e.ctrlKey || e.shiftKey || selectionActive)) {
      e.preventDefault()
      onSelect(gallery.id, e)
    }
  }

  function handleCheckboxClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onSelect?.(gallery.id, e)
  }

  return (
    <Link
      href={`/dashboard/gallery/${gallery.id}`}
      className="group block bg-white transition-all duration-300 relative"
      style={{
        border: isSelected
          ? '1px solid rgba(201,169,110,0.7)'
          : isUrgent
          ? '1px solid rgba(201,169,110,0.45)'
          : '1px solid #e7e5e4',
        boxShadow: isSelected
          ? '0 0 0 3px rgba(201,169,110,0.15)'
          : isUrgent
          ? '0 0 0 3px rgba(201,169,110,0.08), 0 2px 12px rgba(0,0,0,0.06)'
          : '0 1px 4px rgba(0,0,0,0.04)',
      }}
      onClick={handleCardClick}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <div
          className="absolute top-2.5 left-2.5 z-10"
          style={{
            opacity: isSelected || selectionActive ? 1 : 0,
            transition: 'opacity 150ms ease',
          }}
          // Show on group-hover via CSS approach — we use inline style + group-hover workaround
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
          onMouseLeave={(e) => {
            if (!isSelected && !selectionActive)
              (e.currentTarget as HTMLDivElement).style.opacity = '0'
          }}
        >
          <button
            onClick={handleCheckboxClick}
            className="w-5 h-5 rounded flex items-center justify-center transition-all duration-150"
            style={{
              background: isSelected ? '#C9A96E' : 'rgba(255,255,255,0.9)',
              border: isSelected ? 'none' : '1px solid #d6d3d1',
              backdropFilter: 'blur(4px)',
            }}
            aria-label={isSelected ? 'Deselect gallery' : 'Select gallery'}
          >
            {isSelected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l2.5 2.5L9 1" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Cover */}
      <div className={`${gallery.coverColor} h-40 w-full relative overflow-hidden`}>
        {gallery.coverPhotoUrl && (
          <img
            src={gallery.coverPhotoUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-700 group-hover:scale-[1.03]"
            style={{ transitionProperty: 'opacity, transform' }}
            onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
          />
        )}
        {/* Subtle gradient veil so the body card reads cleanly */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/14 to-transparent" />

        {/* Actions menu — top-right of cover */}
        <div
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        >
          <div className="rounded" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(6px)' }}>
            <GalleryCardMenu gallery={gallery} folders={folders} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">

        {/* Title + status chip */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-serif text-base text-stone-900 leading-snug truncate min-w-0">
            {gallery.title}
          </h3>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-sans font-medium tracking-wide ${meta.chip}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
            {meta.label}
          </span>
        </div>

        <p className="text-sm text-stone-400 font-sans mb-4 truncate">{gallery.clientName}</p>

        {/* Selection progress */}
        {showProgress && (
          <div className="mb-4">
            <div className="h-px bg-stone-100 rounded-full mb-2 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[11px] font-sans text-stone-400">
              <span className="text-stone-700 font-medium tabular-nums">{selectedCount}</span>
              {' of '}
              <span className="tabular-nums">{gallery.photoCount}</span>
              {' photos selected'}
            </p>
          </div>
        )}

        {/* Footer: quick action left, meta right */}
        <div className="flex items-center justify-between gap-3 pt-1">

          {/* Quick action — one per state */}
          {action === 'deliver' && (
            <button
              className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-stone-950 text-[11px] font-sans font-medium px-2.5 py-1 transition-colors duration-200"
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            >
              <Download size={10} strokeWidth={2.5} />
              Enable download
            </button>
          )}

          {action === 'share' && (
            <button
              className="inline-flex items-center gap-1.5 border border-stone-200 hover:border-stone-400 text-stone-500 hover:text-stone-700 text-[11px] font-sans font-medium px-2.5 py-1 transition-colors duration-200"
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            >
              <Link2 size={10} strokeWidth={2} />
              Share gallery
            </button>
          )}

          {action === 'awaiting' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-sans text-stone-400">
              <Clock size={11} strokeWidth={1.5} />
              Not opened yet
            </span>
          )}

          {action === 'selecting' && (
            <span className="text-[11px] font-sans text-stone-500 italic">Selecting…</span>
          )}

          {action === 'delivered' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-sans text-emerald-600">
              <CheckCircle2 size={11} strokeWidth={1.5} />
              Download enabled
            </span>
          )}

          {action === 'archived' && (
            <span className="text-[11px] font-sans text-stone-300">{gallery.photoCount} photos</span>
          )}

          {/* Right meta: photo count + expiry */}
          {action !== 'archived' && (
            <p className="text-[11px] font-sans text-stone-300 ml-auto shrink-0">
              {gallery.photoCount} photos
              {gallery.expiresAt ? ` · exp. ${fmtDate(gallery.expiresAt)}` : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
