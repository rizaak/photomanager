'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { GalleryCard } from '@/components/gallery/GalleryCard'
import { FolderStrip } from '@/components/dashboard/FolderStrip'
import { BulkActionBar, type BulkAction } from '@/components/dashboard/BulkActionBar'
import type { Gallery, GalleryFolder } from '@/lib/types'

interface DashboardGalleryListProps {
  galleries: Gallery[]
  folders: GalleryFolder[]
  presets: { id: string; name: string }[]
  activeFolderId?: string
}

export function DashboardGalleryList({
  galleries,
  folders,
  presets,
  activeFolderId,
}: DashboardGalleryListProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const lastClickedId = useRef<string | null>(null)

  const selectionActive = selectedIds.size > 0

  const handleSelect = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (e.shiftKey && lastClickedId.current) {
        const flat = galleries.map((g) => g.id)
        const from = flat.indexOf(lastClickedId.current)
        const to   = flat.indexOf(id)
        if (from !== -1 && to !== -1) {
          const [start, end] = from < to ? [from, to] : [to, from]
          const range = flat.slice(start, end + 1)
          setSelectedIds((prev) => {
            const next = new Set(prev)
            range.forEach((rid) => next.add(rid))
            return next
          })
          lastClickedId.current = id
          return
        }
      }
      lastClickedId.current = id
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id); else next.add(id)
        return next
      })
    },
    [galleries],
  )

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    lastClickedId.current = null
  }, [])

  async function runBulkAction(action: BulkAction) {
    const galleryIds = [...selectedIds]
    const res = await fetch('/api/galleries/bulk', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ galleryIds, action }),
    })
    if (!res.ok) return
    clearSelection()
    router.refresh()
  }

  return (
    <>
      {/* Folder strip */}
      <FolderStrip folders={folders} activeFolderId={activeFolderId} />

      {/* Gallery grid */}
      {galleries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {galleries.map((g) => (
            <GalleryCard
              key={g.id}
              gallery={g}
              folders={folders}
              isSelected={selectedIds.has(g.id)}
              selectionActive={selectionActive}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <p className="font-serif text-stone-400 text-lg">No galleries here</p>
          <p className="text-sm text-stone-400 font-sans">Move galleries to this folder or adjust your filters</p>
        </div>
      )}

      {/* Bulk action bar */}
      {selectionActive && (
        <BulkActionBar
          count={selectedIds.size}
          folders={folders}
          presets={presets}
          onAction={runBulkAction}
          onClear={clearSelection}
        />
      )}
    </>
  )
}
