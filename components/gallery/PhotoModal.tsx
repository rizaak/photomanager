'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Heart, Send, Pencil, Trash2, Loader2, Download } from 'lucide-react'
import type { Photo } from '@/lib/types'

interface PhotoModalProps {
  photos: Photo[]
  initialIndex: number
  favoritedIds: Set<string>
  photoComments?: Map<string, { id: string; body: string }>
  allowComments?: boolean
  allowDownload?: boolean
  onClose: () => void
  onFavoriteToggle?: (photoId: string) => void
  onAddComment?: (photoId: string, body: string) => Promise<void>
  onUpdateComment?: (commentId: string, body: string, photoId: string) => Promise<void>
  onDeleteComment?: (commentId: string, photoId: string) => Promise<void>
}

// How long chrome stays visible after last interaction
const CHROME_HIDE_MS = 3800
// Minimum horizontal travel (px) to count as a swipe
const SWIPE_X = 52
// Maximum vertical drift allowed during swipe
const SWIPE_Y = 60

function getPhotoStyle(photo: Photo): React.CSSProperties {
  const isPortrait = photo.height >= photo.width
  const MAX_H = 'calc(100vh - 160px)'
  const MAX_W = 'calc(100vw - 80px)'
  return {
    aspectRatio: `${photo.width} / ${photo.height}`,
    maxHeight: MAX_H,
    maxWidth: MAX_W,
    ...(isPortrait ? { height: MAX_H, width: 'auto' } : { width: MAX_W, height: 'auto' }),
  }
}

export function PhotoModal({
  photos,
  initialIndex,
  favoritedIds,
  photoComments,
  allowComments,
  allowDownload,
  onClose,
  onFavoriteToggle,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: PhotoModalProps) {
  const [index, setIndex] = useState(initialIndex)
  const [fading, setFading] = useState(false)
  const [chromeVisible, setChromeVisible] = useState(true)
  const [downloading, setDownloading] = useState(false)

  // Comment state
  const [editingComment, setEditingComment] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)
  const [commentDeleting, setCommentDeleting] = useState(false)

  const chromeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const swipeStart  = useRef<{ x: number; y: number } | null>(null)
  const swipeFired  = useRef(false)

  const photo          = photos[index]
  const favorited      = favoritedIds.has(photo.id)
  const existingComment = photoComments?.get(photo.id) ?? null

  // Reset comment editing state when navigating to a different photo
  useEffect(() => {
    setEditingComment(false)
    setCommentDraft('')
  }, [index])

  async function handleDownload() {
    if (downloading) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/photos/${photo.id}/download`)
      if (!res.ok) throw new Error('Download failed')
      const { url } = await res.json()
      const a = document.createElement('a')
      a.href = url
      a.download = photo.filename ?? photo.id
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      // silently ignore — user can retry
    } finally {
      setDownloading(false)
    }
  }

  async function handleSaveComment() {
    if (!commentDraft.trim() || commentSaving) return
    setCommentSaving(true)
    try {
      if (existingComment) {
        await onUpdateComment?.(existingComment.id, commentDraft.trim(), photo.id)
      } else {
        await onAddComment?.(photo.id, commentDraft.trim())
      }
      setEditingComment(false)
      setCommentDraft('')
    } finally {
      setCommentSaving(false)
    }
  }

  async function handleDeleteComment() {
    if (!existingComment || commentDeleting) return
    setCommentDeleting(true)
    try {
      await onDeleteComment?.(existingComment.id, photo.id)
    } finally {
      setCommentDeleting(false)
    }
  }

  function startEdit() {
    setCommentDraft(existingComment?.body ?? '')
    setEditingComment(true)
  }

  function cancelEdit() {
    setEditingComment(false)
    setCommentDraft('')
  }

  // ── Chrome auto-hide ─────────────────────────────────────────────────────
  const revealChrome = useCallback(() => {
    setChromeVisible(true)
    clearTimeout(chromeTimer.current)
    chromeTimer.current = setTimeout(() => setChromeVisible(false), CHROME_HIDE_MS)
  }, [])

  const chromeFade: React.CSSProperties = {
    opacity: chromeVisible ? 1 : 0,
    transition: 'opacity 700ms ease',
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

  // ── Swipe gesture ────────────────────────────────────────────────────────
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
      if (e.key === 'Escape') {
        if (editingComment) { cancelEdit(); return }
        onClose()
      }
      if (e.key === 'ArrowLeft'  && !editingComment) goPrev()
      if (e.key === 'ArrowRight' && !editingComment) goNext()
      if ((e.key === 'h' || e.key === 'H') && !editingComment) onFavoriteToggle?.(photo.id)
      revealChrome()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext, onFavoriteToggle, photo.id, revealChrome, editingComment])

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: '#0D0C0B', animation: 'modalReveal 680ms cubic-bezier(0.22,1,0.36,1) forwards' }}
      onMouseMove={revealChrome}
      onTouchStart={revealChrome}
    >

      {/* ── Header ────────────────────────────────────────────────────────── */}
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
        <button
          onClick={onClose}
          className="text-stone-500 hover:text-stone-200 transition-colors duration-200"
          aria-label="Close"
        >
          <X size={17} strokeWidth={1.5} />
        </button>
      </header>

      {/* ── Photo area ────────────────────────────────────────────────────── */}
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
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/[0.07] transition-all duration-200 disabled:opacity-20"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <ChevronLeft size={18} strokeWidth={1.25} />
          </div>
        </button>

        {/* Photo */}
        <div
          className="relative"
          onClick={(e) => e.stopPropagation()}
          style={{
            opacity: fading ? 0 : 1,
            transition: fading ? 'opacity 180ms ease-in' : 'opacity 480ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <div className={`${photo.placeholderColor} relative`} style={getPhotoStyle(photo)}>
            {photo.watermarkedUrl && (
              <img
                src={photo.watermarkedUrl}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain opacity-0"
                style={{
                  transition: 'opacity 500ms ease',
                  pointerEvents: 'none',
                  WebkitUserDrag: 'none',
                } as React.CSSProperties}
                onContextMenu={(e) => e.preventDefault()}
                ref={(img) => { if (img?.complete) img.style.opacity = '1' }}
                onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
              />
            )}

            {!photo.watermarkedUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-white/[0.04] font-serif text-6xl rotate-[-30deg] tracking-[0.3em]">
                  FRAME
                </span>
              </div>
            )}

            {/* Favorited glow dot */}
            <div
              className="absolute top-3 right-3 w-2 h-2 rounded-full"
              style={{
                backgroundColor: '#C9A96E',
                opacity: favorited ? 1 : 0,
                boxShadow: favorited ? '0 0 8px rgba(201,169,110,0.7)' : 'none',
                transform: favorited ? 'scale(1)' : 'scale(0.4)',
                transition: 'opacity 400ms ease, transform 400ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 400ms ease',
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
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/[0.07] transition-all duration-200"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <ChevronRight size={18} strokeWidth={1.25} />
          </div>
        </button>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="absolute bottom-0 inset-x-0 z-20 px-5 pt-14 pb-6"
        style={{
          background: 'linear-gradient(to top, rgba(13,12,11,0.85) 0%, transparent 100%)',
          ...chromeFade,
          pointerEvents: chromeVisible ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Heart — favorite toggle, only when enabled */}
          {onFavoriteToggle ? (
            <button
              onClick={() => onFavoriteToggle(photo.id)}
              className="transition-colors duration-200 text-stone-500 hover:text-stone-300"
              aria-label={favorited ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Heart
                size={18}
                strokeWidth={favorited ? 0 : 1.25}
                style={{
                  fill:       favorited ? '#C9A96E' : 'transparent',
                  color:      favorited ? '#C9A96E' : undefined,
                  transition: 'fill 450ms ease, transform 300ms cubic-bezier(0.34,1.56,0.64,1)',
                  transform:  favorited ? 'scale(1.18)' : 'scale(1)',
                }}
              />
            </button>
          ) : <span />}

          {/* Download — for photographer preview context */}
          {allowDownload && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="text-stone-500 hover:text-stone-300 transition-colors duration-200 disabled:opacity-40"
              aria-label="Download original"
            >
              <Download
                size={17}
                strokeWidth={1.25}
                style={{
                  transform: downloading ? 'translateY(2px)' : 'translateY(0)',
                  transition: 'transform 300ms ease',
                }}
              />
            </button>
          )}
        </div>

        {/* Comment section — shown when allowComments, regardless of favorite status */}
        {allowComments && (
          <div className="mt-4">
            {editingComment ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveComment()
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  placeholder="Add a note for your photographer…"
                  maxLength={2000}
                  className="flex-1 bg-transparent border-b border-stone-700 text-xs font-sans text-stone-300 placeholder-stone-700 focus:outline-none focus:border-stone-500 pb-0.5 transition-colors duration-200"
                  style={{ caretColor: '#C9A96E' }}
                />
                <button
                  onClick={handleSaveComment}
                  disabled={!commentDraft.trim() || commentSaving}
                  className="text-stone-500 hover:text-stone-300 disabled:opacity-30 transition-colors duration-200"
                  aria-label="Save note"
                >
                  {commentSaving
                    ? <Loader2 size={12} strokeWidth={1.5} className="animate-spin" />
                    : <Send size={12} strokeWidth={1.5} />
                  }
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-stone-600 hover:text-stone-400 transition-colors duration-200"
                  aria-label="Cancel"
                >
                  <X size={12} strokeWidth={1.5} />
                </button>
              </div>
            ) : existingComment ? (
              <div className="flex items-center gap-2.5 group/note">
                <p className="flex-1 text-xs font-sans text-stone-500 truncate">
                  {existingComment.body}
                </p>
                <button
                  onClick={startEdit}
                  className="opacity-0 group-hover/note:opacity-100 text-stone-600 hover:text-stone-400 transition-all duration-200"
                  aria-label="Edit note"
                >
                  <Pencil size={11} strokeWidth={1.5} />
                </button>
                <button
                  onClick={handleDeleteComment}
                  disabled={commentDeleting}
                  className="opacity-0 group-hover/note:opacity-100 text-stone-600 hover:text-red-500 disabled:opacity-40 transition-all duration-200"
                  aria-label="Delete note"
                >
                  {commentDeleting
                    ? <Loader2 size={11} strokeWidth={1.5} className="animate-spin" />
                    : <Trash2 size={11} strokeWidth={1.5} />
                  }
                </button>
              </div>
            ) : (
              <button
                onClick={startEdit}
                className="text-xs font-sans text-stone-700 hover:text-stone-500 transition-colors duration-200"
              >
                Add a note…
              </button>
            )}
          </div>
        )}
      </footer>
    </div>
  )
}
