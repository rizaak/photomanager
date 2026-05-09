'use client'

import { useEffect } from 'react'

interface ConfirmDialogProps {
  open:          boolean
  title:         string
  description?:  React.ReactNode
  confirmLabel?: string
  cancelLabel?:  string
  danger?:       boolean
  busy?:         boolean
  onConfirm:     () => void
  onCancel:      () => void
}

export function ConfirmDialog({
  open, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, busy = false,
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !busy) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}
    >
      <div className="bg-white shadow-2xl p-5 w-80">
        <p className="text-sm font-sans text-stone-800 mb-1 font-medium">{title}</p>
        {description && (
          <p className="text-xs font-sans text-stone-500 mb-4">{description}</p>
        )}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 text-[11px] font-sans font-medium text-white py-1.5 transition-colors disabled:opacity-40"
            style={{ background: danger ? '#ef4444' : '#1c1917' }}
            onMouseEnter={(e) => { if (!busy) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '' }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 text-[11px] font-sans text-stone-500 hover:text-stone-700 border border-stone-200 py-1.5 disabled:opacity-40"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
