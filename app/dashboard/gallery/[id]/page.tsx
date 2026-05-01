import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye, Settings, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ShareButton } from '@/components/gallery/ShareButton'
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
  const { id } = await params
  const photographerId = await getAuthenticatedPhotographer()
  const gallery = await GalleryService.getDetail(id, photographerId)

  if (!gallery) notFound()

  const [clients, initialPhotosData, allSections, watermarkPresets] = await Promise.all([
    ClientService.listForGallery(id),
    GalleryPhotosService.listForDashboard(id, {}),
    GallerySectionService.listForGallery(id),
    WatermarkService.list(photographerId),
  ])

  const totalPhotos = initialPhotosData.total
  const sel         = gallery.selection
  const isSubmitted = !!sel?.submittedAt

  return (
    <div className="min-h-screen">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-sm font-sans transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Galleries
          </Link>
          <span className="text-stone-200">/</span>
          <span className="text-sm font-sans text-stone-700 font-medium">{gallery.title}</span>
          <Badge variant={gallery.status.toLowerCase() as GalleryStatus} />
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/gallery/${id}/upload`}>
            <Button variant="primary" size="sm">
              <Upload size={13} strokeWidth={1.5} />
              Upload
            </Button>
          </Link>
          <Link href={`/gallery/${gallery.shareToken}?preview=1`} target="_blank">
            <Button variant="ghost" size="sm">
              <Eye size={13} strokeWidth={1.5} />
              Preview
            </Button>
          </Link>
          <ShareButton shareToken={gallery.shareToken} />
          <Link href={`/dashboard/gallery/${id}/settings`}>
            <Button variant="ghost" size="sm">
              <Settings size={13} strokeWidth={1.5} />
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Gallery info ──────────────────────────────────────────────────── */}
      <div className="px-10 pt-8 pb-6 border-b border-stone-100">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-serif text-3xl text-stone-900 mb-1">{gallery.title}</h1>
            <p className="text-stone-400 font-sans text-sm">{gallery.clientName}</p>
          </div>
          <div className="flex items-center gap-8 text-right">
            <div>
              <p className="text-2xl font-serif text-stone-900">{gallery.photoCount ?? totalPhotos}</p>
              <p className="text-xs font-sans text-stone-400 uppercase tracking-widest">Photos</p>
            </div>
            <div>
              <p className="text-2xl font-serif text-stone-900">{sel?.photoCount ?? 0}</p>
              <p className="text-xs font-sans text-stone-400 uppercase tracking-widest">Selected</p>
            </div>
            <div>
              <p className="text-2xl font-serif text-stone-900">{clients.length}</p>
              <p className="text-xs font-sans text-stone-400 uppercase tracking-widest">Clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Selection notice ──────────────────────────────────────────────── */}
      {isSubmitted && sel && (
        <div className="px-10 pt-5">
          <div className="flex items-center justify-between px-5 py-3.5 border border-stone-200 bg-stone-50/60">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-sans text-stone-400 uppercase tracking-widest shrink-0">
                Client Selection
              </span>
              <span className="text-sm font-sans text-stone-700">
                {sel.photoCount} photo{sel.photoCount !== 1 ? 's' : ''}
              </span>
              <span
                className="px-2 py-0.5 text-[10px] font-sans font-medium text-stone-600 bg-stone-100"
              >
                {WORKFLOW_LABEL[sel.workflowState as string] ?? sel.workflowState}
              </span>
              {sel.submittedAt && (
                <span className="text-xs font-sans text-stone-400">
                  {new Date(sel.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <Link
              href={`/dashboard/gallery/${id}/selections`}
              className="text-xs font-sans text-stone-500 hover:text-stone-900 transition-colors shrink-0"
            >
              Manage selection →
            </Link>
          </div>
        </div>
      )}

      {/* ── Photos ───────────────────────────────────────────────────────── */}
      <div className="px-10 py-8">
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

      {/* ── Clients ───────────────────────────────────────────────────────── */}
      {clients.length > 0 && (
        <div className="px-10 pb-6 border-t border-stone-100 pt-6">
          <h2 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-4">Clients</h2>
          <div>
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-stone-100 flex items-center justify-center text-xs font-sans text-stone-500 font-medium shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-sans text-stone-800">{client.name}</p>
                    <p className="text-xs font-sans text-stone-400">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm font-sans text-stone-700">{client.photoCount}</p>
                    <p className="text-xs font-sans text-stone-400">selected</p>
                  </div>
                  {client.favoritesCount > 0 && (
                    <div>
                      <p className="text-sm font-sans text-stone-700">{client.favoritesCount}</p>
                      <p className="text-xs font-sans text-stone-400">favourites</p>
                    </div>
                  )}
                  {client.commentsCount > 0 && (
                    <div>
                      <p className="text-sm font-sans text-stone-700">{client.commentsCount}</p>
                      <p className="text-xs font-sans text-stone-400">comments</p>
                    </div>
                  )}
                  <div>
                    {client.submittedAt ? (
                      <>
                        <p className="text-xs font-sans" style={{ color: '#C9A96E' }}>Submitted</p>
                        <p className="text-xs font-sans text-stone-400">
                          {new Date(client.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </>
                    ) : client.photoCount > 0 ? (
                      <p className="text-xs font-sans text-stone-400">Selecting</p>
                    ) : (
                      <p className="text-xs font-sans text-stone-400">Browsing</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity link ─────────────────────────────────────────────────── */}
      <div className="px-10 py-5 border-t border-stone-100 flex items-center justify-between">
        <span className="text-xs font-sans text-stone-400">Gallery activity</span>
        <Link
          href={`/dashboard/gallery/${id}/activity`}
          className="text-xs font-sans text-stone-500 hover:text-stone-900 transition-colors"
        >
          View activity →
        </Link>
      </div>

    </div>
  )
}
