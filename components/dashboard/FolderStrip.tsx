'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FolderOpen, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import type { GalleryFolder } from '@/lib/types'

interface FolderStripProps {
  folders: GalleryFolder[]
  activeFolderId?: string
}

export function FolderStrip({ folders, activeFolderId }: FolderStripProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [list, setList]   = useState<GalleryFolder[]>(folders)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName]   = useState('')
  const [editId, setEditId]     = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [busy, setBusy]         = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function navigate(folderId?: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (folderId) params.set('folder', folderId)
    else          params.delete('folder')
    router.push(`/dashboard?${params.toString()}`)
  }

  async function createFolder() {
    if (!newName.trim() || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/folders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) return
      const folder = await res.json()
      setList((prev) => [...prev, { ...folder, galleryCount: 0 }])
      setNewName('')
      setCreating(false)
    } finally { setBusy(false) }
  }

  async function renameFolder() {
    if (!editId || !editName.trim() || busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/folders/${editId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: editName.trim() }),
      })
      if (!res.ok) return
      const updated = await res.json()
      setList((prev) => prev.map((f) => f.id === editId ? { ...f, name: updated.name } : f))
      setEditId(null)
    } finally { setBusy(false) }
  }

  async function deleteFolder(id: string) {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' })
      if (!res.ok) return
      setList((prev) => prev.filter((f) => f.id !== id))
      if (activeFolderId === id) navigate(undefined)
    } finally { setBusy(false) }
  }

  if (list.length === 0 && !creating) {
    return (
      <button
        onClick={() => setCreating(true)}
        className="inline-flex items-center gap-1.5 text-[11px] font-sans text-stone-400 hover:text-stone-600 transition-colors duration-150 mb-6"
      >
        <Plus size={11} strokeWidth={2} />
        New folder
      </button>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        {/* All galleries chip */}
        <FolderChip
          label="All galleries"
          count={null}
          active={!activeFolderId}
          onClick={() => navigate(undefined)}
        />

        {/* Folder chips */}
        {list.map((folder) => (
          editId === folder.id ? (
            <div key={folder.id} className="flex items-center gap-1.5 border border-stone-300 px-2.5 py-1 bg-white">
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') renameFolder(); if (e.key === 'Escape') setEditId(null) }}
                className="text-xs font-sans text-stone-700 outline-none w-28 bg-transparent"
                autoFocus
              />
              <button onClick={renameFolder} disabled={busy} className="text-stone-500 hover:text-stone-800">
                <Check size={12} strokeWidth={2} />
              </button>
              <button onClick={() => setEditId(null)} className="text-stone-400 hover:text-stone-600">
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div key={folder.id} className="group/chip flex items-center gap-0.5">
              <FolderChip
                label={folder.name}
                count={folder.galleryCount}
                active={activeFolderId === folder.id}
                onClick={() => navigate(folder.id)}
              />
              {/* Inline edit/delete — only visible on hover */}
              <div className="opacity-0 group-hover/chip:opacity-100 transition-opacity duration-150 flex items-center">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditId(folder.id); setEditName(folder.name) }}
                  className="p-1 text-stone-300 hover:text-stone-600"
                >
                  <Pencil size={10} strokeWidth={1.75} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id) }}
                  className="p-1 text-stone-300 hover:text-red-500"
                >
                  <Trash2 size={10} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )
        ))}

        {/* Create new folder */}
        {creating ? (
          <div className="flex items-center gap-1.5 border border-stone-300 px-2.5 py-1 bg-white">
            <FolderOpen size={11} strokeWidth={1.5} className="text-stone-400 shrink-0" />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
              placeholder="Folder name"
              className="text-xs font-sans text-stone-700 outline-none w-28 bg-transparent placeholder:text-stone-300"
              autoFocus
            />
            <button onClick={createFolder} disabled={busy || !newName.trim()} className="text-stone-500 hover:text-stone-800 disabled:opacity-30">
              <Check size={12} strokeWidth={2} />
            </button>
            <button onClick={() => { setCreating(false); setNewName('') }} className="text-stone-400 hover:text-stone-600">
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-sans text-stone-400 hover:text-stone-600 border border-dashed border-stone-200 hover:border-stone-400 transition-colors duration-150"
          >
            <Plus size={11} strokeWidth={2} />
            New folder
          </button>
        )}
      </div>
    </div>
  )
}

function FolderChip({
  label, count, active, onClick,
}: { label: string; count: number | null; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-sans transition-all duration-150"
      style={{
        background:  active ? '#1c1917' : '#fafaf9',
        color:       active ? '#fafaf9' : '#78716c',
        border:      active ? '1px solid #1c1917' : '1px solid #e7e5e4',
      }}
    >
      {label}
      {count !== null && (
        <span style={{ color: active ? 'rgba(255,255,255,0.5)' : '#a8a29e' }}>{count}</span>
      )}
    </button>
  )
}
