'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { DeleteSectionDialog } from './DeleteSectionDialog'

interface Section {
  id:              string
  title:           string
  sortOrder:       number
  visibleToClient: boolean
}

interface GallerySectionsClientProps {
  galleryId: string
}

export function GallerySectionsClient({ galleryId }: GallerySectionsClientProps) {
  const [sections,  setSections]  = useState<Section[]>([])
  const [loading,   setLoading]   = useState(true)
  const [adding,    setAdding]    = useState(false)
  const [newTitle,  setNewTitle]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [editTitle,      setEditTitle]      = useState('')
  const [deletingSection, setDeletingSection] = useState<Section | null>(null)
  const addInputRef  = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/galleries/${galleryId}/sections`)
      .then((r) => r.ok ? r.json() : { sections: [] })
      .then((d) => setSections(d.sections ?? []))
      .finally(() => setLoading(false))
  }, [galleryId])

  useEffect(() => {
    if (adding) addInputRef.current?.focus()
  }, [adding])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  async function handleAdd() {
    const title = newTitle.trim()
    if (!title || saving) return
    setSaving(true)
    const res = await fetch(`/api/galleries/${galleryId}/sections`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title }),
    })
    if (res.ok) {
      const s: Section = await res.json()
      setSections((prev) => [...prev, s])
      setNewTitle('')
      setAdding(false)
    }
    setSaving(false)
  }

  async function handleRename(id: string) {
    const title = editTitle.trim()
    if (!title || saving) return
    setSaving(true)
    const res = await fetch(`/api/galleries/${galleryId}/sections/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title }),
    })
    if (res.ok) {
      const updated: Section = await res.json()
      setSections((prev) => prev.map((s) => s.id === id ? { ...s, title: updated.title } : s))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function handleToggleVisibility(section: Section) {
    const next = !section.visibleToClient
    const res = await fetch(`/api/galleries/${galleryId}/sections/${section.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ visibleToClient: next }),
    })
    if (res.ok) {
      setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, visibleToClient: next } : s))
    }
  }


  if (loading) {
    return <p className="text-sm font-sans text-stone-400 px-8 py-8">Loading…</p>
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-7 flex items-end justify-between">
        <div>
          <h2 className="font-serif text-2xl text-stone-900 mb-1">Sections</h2>
          <p className="text-sm font-sans text-stone-400">
            Organise photos into collections. Control which sections clients can see.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => { setAdding(true); setNewTitle('') }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-sans border border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-colors"
          >
            <Plus size={12} strokeWidth={2} />
            Add section
          </button>
        )}
      </div>

      {/* Add row */}
      {adding && (
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-stone-100">
          <input
            ref={addInputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
            }}
            placeholder="Section name"
            className="flex-1 bg-white border border-stone-300 px-3 py-2 text-sm font-sans text-stone-800 focus:outline-none focus:border-stone-500 transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || saving}
            className="px-3 py-2 text-xs font-sans bg-stone-900 text-white disabled:opacity-40 hover:bg-stone-800 transition-colors"
          >
            {saving ? 'Adding…' : 'Add'}
          </button>
          <button
            onClick={() => { setAdding(false); setNewTitle('') }}
            className="text-stone-400 hover:text-stone-700 transition-colors p-2"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {sections.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-serif text-lg text-stone-400 mb-1">No sections yet</p>
          <p className="text-sm font-sans text-stone-400">
            Add sections to organise photos into collections.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {sections.map((section) => (
            <div key={section.id} className="flex items-center gap-3 py-3.5">

              {editingId === section.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    ref={editInputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(section.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="flex-1 bg-white border border-stone-300 px-3 py-1.5 text-sm font-sans text-stone-800 focus:outline-none focus:border-stone-500 transition-colors"
                  />
                  <button
                    onClick={() => handleRename(section.id)}
                    disabled={saving}
                    className="text-stone-600 hover:text-stone-900 disabled:opacity-40 transition-colors p-1"
                  >
                    <Check size={14} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-stone-400 hover:text-stone-700 transition-colors p-1"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <p className="flex-1 text-sm font-sans text-stone-800">{section.title}</p>
              )}

              {editingId !== section.id && (
                <div className="flex items-center gap-1 shrink-0">
                  {/* Visibility pill */}
                  <button
                    onClick={() => handleToggleVisibility(section)}
                    className={`px-2.5 py-1 text-[10px] font-sans rounded-full border transition-colors ${
                      section.visibleToClient
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        : 'border-stone-200 text-stone-400 bg-stone-50'
                    }`}
                  >
                    {section.visibleToClient ? 'Visible' : 'Hidden'}
                  </button>

                  {/* Rename */}
                  <button
                    onClick={() => { setEditingId(section.id); setEditTitle(section.title) }}
                    className="p-2 text-stone-300 hover:text-stone-600 transition-colors"
                    aria-label="Rename section"
                  >
                    <Pencil size={13} strokeWidth={1.5} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeletingSection(section)}
                    className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                    aria-label="Delete section"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs font-sans text-stone-400">
        Hidden sections are not visible to clients. Photos inside them are excluded from the gallery.
      </p>

      {deletingSection && (
        <DeleteSectionDialog
          section={deletingSection}
          galleryId={galleryId}
          onClose={() => setDeletingSection(null)}
          onDeleted={(id) => setSections((prev) => prev.filter((s) => s.id !== id))}
        />
      )}
    </div>
  )
}
