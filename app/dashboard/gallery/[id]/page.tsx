import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Upload } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { GallerySectionService } from '@/src/modules/galleries/services/GallerySectionService'
import { GalleryPhotosService } from '@/src/modules/photos/services/GalleryPhotosService'
import { ClientService } from '@/src/modules/clients/services/ClientService'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { DashboardPhotoGrid } from '@/components/gallery/DashboardPhotoGrid'
import { WatermarkService } from '@/src/modules/watermarks/services/WatermarkService'
import type { GalleryStatus } from '@/lib/types'

const WORKFLOW_LABEL: Record<string, string> = {
  IN_PROGRESS:         'In Progress',
  COMPLETED_BY_CLIENT: 'Submitted',
  IN_REVIEW:           'In Review',
  EDITING:             'Editing',
  DELIVERED:           'Delivered',
}

export default async function GalleryManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }         = await params
  const photographerId = await getAuthenticatedPhotographer()
  const gallery        = await GalleryService.getDetail(id, photographerId)

  if (!gallery) notFound()

  const [clientCount, initialPhotosData, allSections, watermarkPresets] = await Promise.all([
    ClientService.listForGallery(id).then((c) => c.length),
    GalleryPhotosService.listForDashboard(id, {}),
    GallerySectionService.listForGallery(id),
    WatermarkService.list(photographerId),
  ])

  const totalPhotos = initialPhotosData.total
  const sel         = gallery.selection
  const isSubmitted = !!sel?.submittedAt
  const coverUrl    = gallery.coverUrl ?? null

  return (
    <div className="min-h-screen">

      {/* ── Cover header ──────────────────────────────────────────────────── */}
      <div className="relative h-48 bg-stone-100 overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-8 pb-5 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="font-serif text-2xl text-white leading-tight">{gallery.title}</h1>
              <Badge variant={gallery.status as GalleryStatus} />
            </div>
            <p className="text-sm font-sans text-white/60">{gallery.clientName}</p>
          </div>

          <div className="flex items-end gap-6 text-right">
            <div>
              <p className="text-xl font-serif text-white">{gallery.photoCount ?? totalPhotos}</p>
              <p className="text-[10px] font-sans text-white/50 uppercase tracking-widest">Photos</p>
            </div>
            <div>
              <p className="text-xl font-serif text-white">{sel?.photoCount ?? 0}</p>
              <p className="text-[10px] font-sans text-white/50 uppercase tracking-widest">Selected</p>
            </div>
            <div>
              <p className="text-xl font-serif text-white">{clientCount}</p>
              <p className="text-[10px] font-sans text-white/50 uppercase tracking-widest">Clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Selection notice ──────────────────────────────────────────────── */}
      {isSubmitted && sel && (
        <div className="px-8 pt-5">
          <div className="flex items-center justify-between px-5 py-3.5 border border-stone-200 bg-stone-50/60">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-sans text-stone-400 uppercase tracking-widest shrink-0">
                Client Selection
              </span>
              <span className="text-sm font-sans text-stone-700">
                {sel.photoCount} photo{sel.photoCount !== 1 ? 's' : ''}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-sans font-medium text-stone-600 bg-stone-100">
                {WORKFLOW_LABEL[sel.workflowState as string] ?? sel.workflowState}
              </span>
              {sel.submittedAt && (
                <span className="text-xs font-sans text-stone-400">
                  {new Date(sel.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <Link
              href={`/dashboard/gallery/${id}/clients`}
              className="text-xs font-sans text-stone-500 hover:text-stone-900 transition-colors shrink-0"
            >
              Manage selection →
            </Link>
          </div>
        </div>
      )}

      {/* ── Photos ───────────────────────────────────────────────────────── */}
      <div className="px-8 py-7">
        {totalPhotos === 0 && allSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-serif text-xl text-stone-400 mb-2">No photos yet</p>
            <p className="text-sm font-sans text-stone-400 mb-6">Upload photos to get started</p>
            <Link href={`/dashboard/gallery/${id}/upload`}>
              <Button variant="primary" size="md">
                <Upload size={15} strokeWidth={1.5} />
                Upload Photos
              </Button>
            </Link>
          </div>
        ) : (
          <DashboardPhotoGrid
            galleryId={id}
            initialPhotos={initialPhotosData.photos as import('@/components/gallery/DashboardPhotoGrid').GridPhoto[]}
            initialSections={allSections}
            initialHasMore={initialPhotosData.hasMore}
            initialTotal={initialPhotosData.total}
            initialAllLabels={initialPhotosData.allLabels}
            initialWatermarkPresets={watermarkPresets}
          />
        )}
      </div>

    </div>
  )
}
