import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { ClientService } from '@/src/modules/clients/services/ClientService'
import { WorkflowService } from '@/src/modules/selections/services/WorkflowService'
import { SelectionWorkflowPanel } from '@/components/gallery/SelectionWorkflowPanel'

export default async function GalleryClientsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }         = await params
  const photographerId = await getAuthenticatedPhotographer()
  const gallery        = await GalleryService.getDetail(id, photographerId)

  if (!gallery) notFound()

  const [clients, workflowData] = await Promise.all([
    ClientService.listForGallery(id),
    gallery.selection?.submittedAt
      ? WorkflowService.getForDashboard(id, photographerId)
      : Promise.resolve(null),
  ])

  return (
    <div className="px-8 py-8 max-w-3xl">

      {/* ── Client list ─────────────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="font-serif text-2xl text-stone-900 mb-1">Clients</h2>
        <p className="text-sm font-sans text-stone-400 mb-7">
          Everyone who has accessed this gallery.
        </p>

        {clients.length === 0 ? (
          <p className="text-sm font-sans text-stone-400">No clients yet.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-100 flex items-center justify-center text-xs font-sans text-stone-500 font-medium shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-sans text-stone-800 font-medium">{client.name}</p>
                    <p className="text-xs font-sans text-stone-400">{client.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  {client.photoCount > 0 && (
                    <div>
                      <p className="text-sm font-sans text-stone-700">{client.photoCount}</p>
                      <p className="text-[10px] font-sans text-stone-400 uppercase tracking-widest">Selected</p>
                    </div>
                  )}
                  {client.favoritesCount > 0 && (
                    <div>
                      <p className="text-sm font-sans text-stone-700">{client.favoritesCount}</p>
                      <p className="text-[10px] font-sans text-stone-400 uppercase tracking-widest">Favourites</p>
                    </div>
                  )}
                  {client.commentsCount > 0 && (
                    <div>
                      <p className="text-sm font-sans text-stone-700">{client.commentsCount}</p>
                      <p className="text-[10px] font-sans text-stone-400 uppercase tracking-widest">Comments</p>
                    </div>
                  )}
                  <div>
                    {client.submittedAt ? (
                      <span className="text-xs font-sans" style={{ color: '#C9A96E' }}>Submitted</span>
                    ) : client.photoCount > 0 ? (
                      <span className="text-xs font-sans text-stone-400">Selecting</span>
                    ) : (
                      <span className="text-xs font-sans text-stone-400">Browsing</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Selection workflow ──────────────────────────────────────── */}
      {workflowData ? (
        <div>
          <div className="mb-6 pt-8 border-t border-stone-100">
            <h2 className="font-serif text-xl text-stone-900 mb-1">Selection</h2>
            <p className="text-sm font-sans text-stone-400">Review and manage the submitted photo selection.</p>
          </div>
          <SelectionWorkflowPanel galleryId={id} initialData={workflowData} />
        </div>
      ) : gallery.selection && !gallery.selection.submittedAt ? (
        <div className="pt-8 border-t border-stone-100">
          <h2 className="font-serif text-xl text-stone-900 mb-1">Selection</h2>
          <p className="text-sm font-sans text-stone-400">
            The client is still selecting photos. You will be notified when they submit.
          </p>
        </div>
      ) : null}

    </div>
  )
}
