'use client'

import { useEffect, useRef, useState } from 'react'

interface DeleteGalleryDialogProps {
  open:        boolean
  galleryName: string
  busy?:       boolean
  onConfirm:   () => void
  onCancel:    () => void
}

export function DeleteGalleryDialog({
  open, galleryName, busy = false, onConfirm, onCancel,
}: DeleteGalleryDialogProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const match = input.trim() === galleryName.trim()

  useEffect(() => {
    if (open) {
      setInput('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

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
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}
    >
      <div className="bg-white shadow-2xl p-6 w-[420px] max-w-[calc(100vw-32px)]">
        <p className="text-sm font-sans font-medium text-stone-800 mb-3">Delete gallery permanently?</p>

        <p className="text-xs font-sans text-stone-500 mb-3">This will immediately and irreversibly delete:</p>
        <ul className="mb-5 space-y-1.5">
          {[
            'The gallery and all its settings',
            'All photos — originals, previews, and thumbnails',
            'Watermarked previews and final delivery files',
            'All sections and photo organization',
            'Client favorites, comments, and feedback',
            'Selection history and client activity',
            'ZIP downloads and delivery packages',
          ].map((line) => (
            <li key={line} className="flex items-start gap-2 text-xs font-sans text-stone-600">
              <span className="text-red-400 shrink-0 leading-4">·</span>
              {line}
            </li>
          ))}
        </ul>

        <p className="text-[11px] font-sans text-stone-500 mb-1.5">
          Type <span className="font-medium text-stone-800">{galleryName}</span> to confirm
        </p>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && match && !busy) onConfirm() }}
          placeholder={galleryName}
          className="w-full text-sm font-sans text-stone-800 border border-stone-300 px-3 py-2 outline-none focus:border-stone-500 mb-4 placeholder:text-stone-300"
        />

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={!match || busy}
            className="flex-1 text-[11px] font-sans font-medium text-white bg-red-500 py-2 transition-colors disabled:opacity-40"
            onMouseEnter={(e) => { if (match && !busy) (e.currentTarget as HTMLButtonElement).style.background = '#dc2626' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '' }}
          >
            {busy ? 'Deleting…' : 'Delete permanently'}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 text-[11px] font-sans text-stone-500 hover:text-stone-700 border border-stone-200 py-2 disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
