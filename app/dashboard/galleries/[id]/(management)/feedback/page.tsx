import { notFound } from 'next/navigation'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { GalleryFeedbackService } from '@/src/modules/feedback/services/GalleryFeedbackService'
import { GalleryFeedbackClient } from '@/components/gallery/GalleryFeedbackClient'

export default async function GalleryFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }         = await params
  const photographerId = await getAuthenticatedPhotographer()

  const gallery = await GalleryService.getDetail(id, photographerId)
  if (!gallery) notFound()

  const clients = await GalleryFeedbackService.getForGallery(id, photographerId)

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-7">
        <h2 className="font-serif text-2xl text-stone-900 mb-1">Client Feedback</h2>
        <p className="text-sm font-sans text-stone-400">
          Favorites and comments from all clients, grouped by person.
        </p>
      </div>
      <GalleryFeedbackClient galleryId={id} initialClients={clients} />
    </div>
  )
}
