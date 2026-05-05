'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export interface SectionRecord {
  id:              string
  title:           string
  sortOrder:       number
  visibleToClient: boolean
}

interface Props {
  galleryId: string
  section:   SectionRecord | null  // null = create new
  onClose:   () => void
  onSaved:   (section: SectionRecord) => void
}

export function SectionDialog({ galleryId, section, onClose, onSaved }: Props) {
  const isEdit = section !== null
  const [title,   setTitle]   = useState(section?.title ?? '')
  const [visible, setVisible] = useState(section?.visibleToClient ?? true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [saving, onClose])

  async function handleSave() {
    const t = title.trim()
    if (!t || saving) return
    setSaving(true)
    setError(null)
    try {
      let res: Response
      if (isEdit) {
        res = await fetch(`/api/galleries/${galleryId}/sections/${section.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ title: t, visibleToClient: visible }),
        })
      } else {
        res = await fetch(`/api/galleries/${galleryId}/sections`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ title: t, visibleToClient: visible }),
        })
      }
      if (res.ok) {
        const saved: SectionRecord = await res.json()
        onSaved(saved)
        onClose()
      } else {
        setError('Could not save section. Please try again.')
        setSaving(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/25"
        onClick={!saving ? onClose : undefined}
      />

      <div className="relative bg-white w-full max-w-sm shadow-2xl">

        <div className="flex items-start justify-between px-6 pt-6 pb-0">
          <h2 className="font-serif text-lg text-stone-900 leading-tight">
            {isEdit ? 'Edit section' : 'New section'}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-stone-300 hover:text-stone-600 transition-colors disabled:opacity-40 mt-0.5 ml-4 shrink-0"
            aria-label="Close"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-sans text-stone-500 mb-1.5">Name</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              placeholder="e.g. Ceremony, Reception, Portraits"
              className="w-full border border-stone-200 px-3 py-2 text-sm font-sans text-stone-800 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-sans text-stone-700">Visible to client</p>
              <p className="text-[11px] font-sans text-stone-400 mt-0.5 leading-snug">
                Hidden sections are excluded from the client gallery
              </p>
            </div>
            <label className="relative inline-flex shrink-0 cursor-pointer select-none">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
              />
              <div
                className={`w-10 h-[22px] rounded-full transition-colors duration-200 relative overflow-hidden peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-stone-500 ${
                  visible ? 'bg-stone-800' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    visible ? 'translate-x-[22px]' : 'translate-x-[3px]'
                  }`}
                />
              </div>
            </label>
          </div>
        </div>

        {error && (
          <p className="px-6 pb-4 text-xs font-sans text-red-500">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-sans text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="px-4 py-2 text-xs font-sans text-white bg-stone-900 hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create section'}
          </button>
        </div>

      </div>
    </div>
  )
}
