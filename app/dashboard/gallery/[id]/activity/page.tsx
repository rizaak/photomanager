import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { ActivityRepository } from '@/src/modules/activity/repositories/ActivityRepository'
import { GalleryActivityFeed } from '@/components/gallery/GalleryActivityFeed'

export default async function GalleryActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const photographerId = await getAuthenticatedPhotographer()

  const gallery = await GalleryService.getDetail(id, photographerId)
  if (!gallery) notFound()

  const events = await ActivityRepository.findByGallery(id, 100)

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
        <span className="text-sm font-sans text-stone-700 font-medium">Activity</span>
      </header>

      <div className="px-10 py-8 max-w-2xl">
        <div className="mb-7">
          <h2 className="font-serif text-2xl text-stone-900 mb-1">Activity</h2>
          <p className="text-sm font-sans text-stone-400">All client events for this gallery.</p>
        </div>

        <GalleryActivityFeed
          events={events.map((e) => ({
            id:        e.id,
            eventType: e.eventType,
            metadata:  e.metadata,
            createdAt: e.createdAt.toISOString(),
          }))}
        />
      </div>

    </div>
  )
}
