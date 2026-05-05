'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  section:   { id: string; title: string }
  galleryId: string
  onClose:   () => void
  onDeleted: (sectionId: string) => void
}

export function DeleteSectionDialog({ section, galleryId, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Lock scroll and handle Escape
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
        method: 'DELETE',
      })
      if (res.ok) {
        onDeleted(section.id)
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25"
        onClick={!deleting ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative bg-white w-full max-w-sm shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-0">
          <div>
            <h2 className="font-serif text-lg text-stone-900 leading-tight">
              Delete section
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={deleting}
            className="text-stone-300 hover:text-stone-600 transition-colors disabled:opacity-40 mt-0.5 ml-4 shrink-0"
            aria-label="Close"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm font-sans text-stone-700 mb-1">
            Delete{' '}
            <span className="font-medium text-stone-900">"{section.title}"</span>?
          </p>
          <p className="text-sm font-sans text-stone-400 leading-relaxed">
            Photos inside will not be deleted. They will remain in the gallery as unsectioned photos.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="px-6 pb-4 text-xs font-sans text-red-500">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 pb-6">
          <button
            autoFocus
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-xs font-sans text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-xs font-sans text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete section'}
          </button>
        </div>

      </div>
    </div>
  )
}
