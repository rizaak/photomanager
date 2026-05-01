import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GalleryFilterBar } from '@/components/dashboard/GalleryFilterBar'
import { GalleryPagination } from '@/components/dashboard/GalleryPagination'
import { DashboardGalleryList } from '@/components/dashboard/DashboardGalleryList'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { GalleryFolderService } from '@/src/modules/galleries/services/GalleryFolderService'
import { PresetRepository } from '@/src/modules/presets/repositories/PresetRepository'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import type { GalleryListQuery } from '@/src/modules/galleries/services/GalleryService'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const photographerId = await getAuthenticatedPhotographer()
  const raw = await searchParams

  // Flatten to string values only
  const query: GalleryListQuery = {
    search:          str(raw.q),
    status:          str(raw.status),
    downloadEnabled: str(raw.downloadEnabled),
    hasSelections:   str(raw.hasSelections),
    tags:            str(raw.tags),
    folder:          str(raw.folder),
    sort:            str(raw.sort),
    page:            str(raw.page),
  }

  const isFiltered = !!(query.search || query.status || query.tags || query.hasSelections || query.downloadEnabled || (query.sort && query.sort !== 'newest'))

  const [result, allTags, folders, presets] = await Promise.all([
    GalleryService.listGalleries(photographerId, query),
    GalleryService.getDistinctTags(photographerId),
    GalleryFolderService.list(photographerId),
    PresetRepository.findAll(photographerId),
  ])

  const { galleries, total, page, pageSize, totalPages } = result

  // Attention strip — only when browsing unfiltered so it's always visible
  const readyToDeliver = isFiltered
    ? []
    : galleries.filter((g) => !g.downloadEnabled && g.clientActivity === 'submitted')

  const activeFolderId = query.folder

  return (
    <div className="px-10 py-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-stone-900 mb-1">Your Galleries</h1>
          <p className="text-sm text-stone-400 font-sans">
            {isFiltered
              ? `${total} result${total !== 1 ? 's' : ''}`
              : `${total} ${total === 1 ? 'gallery' : 'galleries'}`}
          </p>
        </div>
        <Link href="/dashboard/new-gallery">
          <Button variant="primary" size="md">
            <Plus size={15} strokeWidth={2} />
            New Gallery
          </Button>
        </Link>
      </div>

      {/* ── Attention strip — client finished selecting ── */}
      {readyToDeliver.length > 0 && (
        <div
          className="mb-8 px-5 py-4 flex items-center justify-between gap-6"
          style={{
            backgroundColor: 'rgba(201,169,110,0.06)',
            border: '1px solid rgba(201,169,110,0.25)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <p className="text-sm font-sans text-stone-700">
              {readyToDeliver.length === 1
                ? `${readyToDeliver[0].clientName} finished selecting — ready to deliver`
                : `${readyToDeliver.length} clients finished selecting — ready to deliver`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {readyToDeliver.map((g) => (
              <Link key={g.id} href={`/dashboard/gallery/${g.id}`}>
                <Button variant="primary" size="sm">
                  <Download size={13} strokeWidth={1.5} />
                  {readyToDeliver.length === 1 ? 'Enable download' : g.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="mb-8">
        <Suspense fallback={<FilterBarPlaceholder />}>
          <GalleryFilterBar allTags={allTags} />
        </Suspense>
      </div>

      {/* ── Gallery grid + folder strip + bulk bar ── */}
      <DashboardGalleryList
        key={JSON.stringify(query)}
        galleries={galleries}
        folders={folders}
        presets={presets.map((p) => ({ id: p.id, name: p.name }))}
        activeFolderId={activeFolderId}
      />

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Suspense fallback={null}>
          <GalleryPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
        </Suspense>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function str(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

function FilterBarPlaceholder() {
  return (
    <div className="space-y-3">
      <div className="h-9 bg-stone-100 animate-pulse" />
      <div className="h-7 bg-stone-50 animate-pulse" style={{ width: '60%' }} />
    </div>
  )
}
