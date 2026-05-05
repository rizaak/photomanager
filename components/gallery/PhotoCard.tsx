'use client'

import { useState } from 'react'
import { Heart, MessageCircle } from 'lucide-react'
import type { Photo } from '@/lib/types'

interface PhotoCardProps {
  photo: Photo
  index: number
  favorited: boolean
  comment?: { id: string; body: string }
  allowComments?: boolean
  onOpen: (index: number) => void
  onFavoriteToggle?: (id: string) => void
  onAddComment?: (photoId: string, body: string) => Promise<void>
  onUpdateComment?: (commentId: string, body: string, photoId: string) => Promise<void>
  onDeleteComment?: (commentId: string, photoId: string) => Promise<void>
  /** Override aspect ratio, e.g. "16/7" or "1/1". Uses natural photo ratio when omitted. */
  aspectRatio?: string
}

export function PhotoCard({
  photo,
  index,
  favorited,
  comment,
  allowComments,
  onOpen,
  onFavoriteToggle,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  aspectRatio: aspectRatioProp,
}: PhotoCardProps) {
  const [commentEditing, setCommentEditing] = useState(false)
  const [commentDraft,   setCommentDraft]   = useState('')
  const [saving,         setSaving]         = useState(false)

  const naturalRatio = photo.height / photo.width
  const paddingBottom = (() => {
    if (!aspectRatioProp) return `${Math.min(Math.max(naturalRatio * 100, 66), 150)}%`
    const [h, w] = aspectRatioProp.split('/').map(Number)
    return `${(h / w) * 100}%`
  })()

  function openCommentEditor() {
    setCommentDraft(comment?.body ?? '')
    setCommentEditing(true)
  }

  async function handleSave() {
    if (saving) return
    const body = commentDraft.trim()
    setSaving(true)
    try {
      if (!body && comment) {
        await onDeleteComment?.(comment.id, photo.id)
      } else if (body && !comment) {
        await onAddComment?.(photo.id, body)
      } else if (body && comment && body !== comment.body) {
        await onUpdateComment?.(comment.id, body, photo.id)
      }
    } finally {
      setSaving(false)
      setCommentEditing(false)
    }
  }

  async function handleRemove() {
    if (!comment || saving) return
    setSaving(true)
    try {
      await onDeleteComment?.(comment.id, photo.id)
    } finally {
      setSaving(false)
      setCommentEditing(false)
    }
  }

  const showBottomBar = !!(onFavoriteToggle || allowComments)

  return (
    <div
      className="relative group overflow-hidden rounded"
      style={{
        boxShadow: favorited
          ? '0 0 28px rgba(201,169,110,0.16), 0 4px 20px rgba(0,0,0,0.44)'
          : '0 2px 12px rgba(0,0,0,0.32)',
        transition: 'box-shadow 500ms ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Photo — tap opens modal (unless comment editor is active) */}
      <div
        className="relative w-full cursor-zoom-in"
        style={{ paddingBottom }}
        onClick={() => { if (!commentEditing) onOpen(index) }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className={`absolute inset-0 ${photo.placeholderColor} brightness-[1.02] group-hover:brightness-[1.09]`}
          style={{ transition: 'filter 280ms ease' }}
        />

        {photo.thumbnailUrl && (
          <img
            src={photo.thumbnailUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            style={{
              transition: 'opacity 400ms ease',
              pointerEvents: 'none',
              WebkitUserDrag: 'none',
            } as React.CSSProperties}
            ref={(img) => { if (img?.complete) img.style.opacity = '1' }}
            onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 pointer-events-none transition-colors duration-300 bg-transparent group-hover:bg-black/[0.18]" />

        {/* Warm wash when favorited */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: favorited ? 1 : 0,
            transition: 'opacity 900ms ease',
            background: 'linear-gradient(to top, rgba(201,169,110,0.08) 0%, rgba(201,169,110,0.02) 60%, transparent 100%)',
          }}
        />
      </div>

      {/* Inline comment editor overlay */}
      {commentEditing && (
        <div
          className="absolute inset-0 z-30 flex flex-col p-3"
          style={{ backgroundColor: 'rgba(10,8,6,0.78)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Add a note…"
            autoFocus
            rows={3}
            className="flex-1 bg-transparent text-white text-xs font-sans resize-none focus:outline-none placeholder:text-white/30 leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setCommentEditing(false)
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
            }}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
            {comment ? (
              <button
                onClick={handleRemove}
                disabled={saving}
                className="text-[10px] font-sans text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                Remove
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setCommentEditing(false)}
                className="text-[10px] font-sans text-white/40 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-[10px] font-sans transition-colors disabled:opacity-40"
                style={{ color: '#C9A96E' }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar: heart + comment button */}
      {showBottomBar && (
        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
          {/* Heart */}
          {onFavoriteToggle ? (
            <button
              className={`
                pointer-events-auto w-6 h-6 flex items-center justify-center
                transition-all duration-200
                ${favorited
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-60'
                }
              `}
              onClick={(e) => { e.stopPropagation(); onFavoriteToggle(photo.id) }}
              aria-label={favorited ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Heart
                size={13}
                strokeWidth={1.5}
                style={{
                  fill:       favorited ? '#C9A96E' : 'transparent',
                  color:      favorited ? '#C9A96E' : 'rgba(255,255,255,0.55)',
                  transition: 'fill 300ms ease, color 300ms ease',
                }}
              />
            </button>
          ) : (
            <span />
          )}

          {/* Comment button — only when allowComments is enabled */}
          {allowComments && (
            <button
              className={`
                pointer-events-auto w-6 h-6 flex items-center justify-center
                transition-all duration-200
                ${comment
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-50'
                }
              `}
              onClick={(e) => { e.stopPropagation(); openCommentEditor() }}
              aria-label={comment ? 'Edit note' : 'Add note'}
            >
              <MessageCircle
                size={12}
                strokeWidth={1.5}
                style={{
                  fill:       comment ? 'rgba(201,169,110,0.25)' : 'transparent',
                  color:      comment ? '#C9A96E' : 'rgba(255,255,255,0.45)',
                  transition: 'fill 300ms ease, color 300ms ease',
                }}
              />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
