import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Share2, Download, Settings, Eye, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { GallerySectionService } from '@/src/modules/galleries/services/GallerySectionService'
import { GalleryPhotosService } from '@/src/modules/photos/services/GalleryPhotosService'
import { WorkflowService } from '@/src/modules/selections/services/WorkflowService'
import { ClientService } from '@/src/modules/clients/services/ClientService'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { DashboardPhotoGrid } from '@/components/gallery/DashboardPhotoGrid'
import { SelectionWorkflowPanel } from '@/components/gallery/SelectionWorkflowPanel'
import type { GalleryStatus } from '@/lib/types'

export default async function GalleryManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const photographerId = await getAuthenticatedPhotographer()
  const gallery = await GalleryService.getDetail(id, photographerId)

  if (!gallery) notFound()

  const hasSubmittedSelection = !!gallery.selection?.submittedAt

  const [clients, photosData, allSections, workflowData] = await Promise.all([
    ClientService.listForGallery(id),
    GalleryPhotosService.getForGallery(id),
    GallerySectionService.listForGallery(id),
    hasSubmittedSelection ? WorkflowService.getForDashboard(id, photographerId) : Promise.resolve(null),
  ])

  // Flatten signed (ready) photos + pending (non-ready) for the grid
  const flatPhotos = [
    ...(photosData?.sections.flatMap((s) =>
      s.photos.map((p) => ({ ...p, sectionId: s.id, status: 'ready' as const })),
    ) ?? []),
    ...(photosData?.unsectioned.map((p) => ({ ...p, sectionId: null, status: 'ready' as const })) ?? []),
    ...(photosData?.pending.map((p) => ({
      id:           p.id,
      galleryId:    p.galleryId,
      filename:     p.filename,
      width:        3,
      height:       2,
      thumbnailUrl: null,
      sectionId:    p.sectionId,
      status:       (p.status === 'FAILED' ? 'failed' : 'processing') as 'processing' | 'failed',
    })) ?? []),
  ]
  const totalPhotos = flatPhotos.length
  const isSubmitted = gallery.clientActivity === 'submitted'
  const sel         = gallery.selection

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
              <Upload size={14} strokeWidth={1.5} />
              Upload Photos
            </Button>
          </Link>
          <Link href={`/gallery/${gallery.shareToken}`} target="_blank">
            <Button variant="ghost" size="sm">
              <Eye size={14} strokeWidth={1.5} />
              Preview
            </Button>
          </Link>
          <Button variant="secondary" size="sm">
            <Share2 size={14} strokeWidth={1.5} />
            Share Link
          </Button>
          {!gallery.downloadEnabled ? (
            <Button variant="primary" size="sm">
              <Download size={14} strokeWidth={1.5} />
              Enable Downloads
            </Button>
          ) : (
            <Button variant="secondary" size="sm">
              <Download size={14} strokeWidth={1.5} />
              Downloads On
            </Button>
          )}
          <Link href={`/dashboard/gallery/${id}/settings`}>
            <Button variant="ghost" size="sm">
              <Settings size={14} strokeWidth={1.5} />
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Selection & editing workflow ──────────────────────────────────── */}
      {workflowData && (
        <SelectionWorkflowPanel
          galleryId={id}
          initialData={workflowData}
        />
      )}

      {/* ── Gallery stats ─────────────────────────────────────────────────── */}
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
            <div>
              <p className="text-sm font-sans text-stone-600">
                {isSubmitted ? 'Submitted' : gallery.clientActivity === 'selecting' ? 'Selecting' : 'Not opened'}
              </p>
              <p className="text-xs font-sans text-stone-400 uppercase tracking-widest">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Registered clients ────────────────────────────────────────────── */}
      {clients.length > 0 && (
        <div className="px-10 pt-8 pb-6 border-b border-stone-100">
          <h2 className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-5">Clients</h2>
          <div className="space-y-0">
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
            initialPhotos={flatPhotos}
            initialSections={allSections}
          />
        )}
      </div>

    </div>
  )
}
