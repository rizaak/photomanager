import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { WorkflowService } from '@/src/modules/selections/services/WorkflowService'
import { SelectionWorkflowPanel } from '@/components/gallery/SelectionWorkflowPanel'

export default async function GallerySelectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const photographerId = await getAuthenticatedPhotographer()

  const gallery = await GalleryService.getDetail(id, photographerId)
  if (!gallery) notFound()

  const hasSubmittedSelection = !!gallery.selection?.submittedAt
  const workflowData = hasSubmittedSelection
    ? await WorkflowService.getForDashboard(id, photographerId)
    : null

  return (
    <div className="min-h-screen bg-white">

      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-10 h-14 flex items-center gap-4">
        <Link
          href={`/dashboard/gallery/${id}`}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-sm font-sans transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          {gallery.title}
        </Link>
        <span className="text-stone-200">/</span>
        <span className="text-sm font-sans text-stone-700 font-medium">Selection</span>
      </header>

      {workflowData ? (
        <div className="pt-6 pb-16">
          <SelectionWorkflowPanel
            galleryId={id}
            initialData={workflowData}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="font-serif text-xl text-stone-400 mb-2">No selection yet</p>
          <p className="text-sm font-sans text-stone-400">
            This gallery will appear here once the client submits their selection.
          </p>
        </div>
      )}

    </div>
  )
}
