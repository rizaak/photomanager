'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type DeleteMode = 'keep_photos' | 'delete_photos'

interface Props {
  section:   { id: string; title: string }
  galleryId: string
  onClose:   () => void
  onDeleted: (sectionId: string, mode: DeleteMode) => void
}

export function DeleteSectionDialog({ section, galleryId, onClose, onDeleted }: Props) {
  const [mode,     setMode]     = useState<DeleteMode>('keep_photos')
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deleting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [deleting, onClose])

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/galleries/${galleryId}/sections/${section.id}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mode }),
      })
      if (res.ok) {
        onDeleted(section.id, mode)
        onClose()
      } else {
        setError('Could not delete section. Please try again.')
        setDeleting(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/25"
        onClick={!deleting ? onClose : undefined}
      />

      <div className="relative bg-white w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-0">
          <h2 className="font-serif text-lg text-stone-900 leading-tight">
            Delete &ldquo;{section.title}&rdquo;
          </h2>
          <button
            onClick={onClose}
            disabled={deleting}
            className="text-stone-300 hover:text-stone-600 transition-colors disabled:opacity-40 mt-0.5 ml-4 shrink-0"
            aria-label="Close"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Options */}
        <div className="px-6 pt-5 pb-2 space-y-3">
          {/* Option A — keep photos */}
          <button
            type="button"
            onClick={() => setMode('keep_photos')}
            className={`w-full text-left px-4 py-3.5 border transition-colors ${
              mode === 'keep_photos'
                ? 'border-stone-900 bg-stone-50'
                : 'border-stone-200 hover:border-stone-400'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                  mode === 'keep_photos' ? 'border-stone-900 bg-stone-900' : 'border-stone-300'
                }`}
              />
              <div>
                <p className="text-sm font-sans font-medium text-stone-800 leading-tight mb-0.5">
                  Delete section only
                </p>
                <p className="text-xs font-sans text-stone-400 leading-relaxed">
                  Photos remain in the gallery as unsectioned.
                </p>
              </div>
            </div>
          </button>

          {/* Option B — delete photos too */}
          <button
            type="button"
            onClick={() => setMode('delete_photos')}
            className={`w-full text-left px-4 py-3.5 border transition-colors ${
              mode === 'delete_photos'
                ? 'border-red-400 bg-red-50'
                : 'border-stone-200 hover:border-red-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                  mode === 'delete_photos' ? 'border-red-500 bg-red-500' : 'border-stone-300'
                }`}
              />
              <div>
                <p className="text-sm font-sans font-medium text-stone-800 leading-tight mb-0.5">
                  Delete section and all photos
                </p>
                <p className="text-xs font-sans text-stone-400 leading-relaxed">
                  Permanently removes all photos, previews, watermarks, and delivery files. Cannot be undone.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="px-6 pt-2 text-xs font-sans text-red-500">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-5">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-xs font-sans text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`px-4 py-2 text-xs font-sans text-white transition-colors disabled:opacity-50 ${
              mode === 'delete_photos'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-stone-800 hover:bg-stone-700'
            }`}
          >
            {deleting
              ? 'Deleting…'
              : mode === 'delete_photos'
                ? 'Delete section and photos'
                : 'Delete section'}
          </button>
        </div>
      </div>
    </div>
  )
}
