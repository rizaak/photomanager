import { notFound } from 'next/navigation'
import { GalleryNav } from '@/components/layout/GalleryNav'
import { GalleryHeader } from '@/components/layout/GalleryHeader'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'

export default async function GalleryLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params:   Promise<{ id: string }>
}) {
  const { id }         = await params
  const photographerId = await getAuthenticatedPhotographer()
  const gallery        = await GalleryService.getDetail(id, photographerId)

  if (!gallery) notFound()

  return (
    <div className="min-h-screen bg-white flex">
      <GalleryNav
        galleryId={id}
        galleryTitle={gallery.title}
        galleryStatus={gallery.status}
      />
      <main className="flex-1 ml-56 min-h-screen bg-white">
        <GalleryHeader
          galleryId={id}
          galleryStatus={gallery.status}
          shareToken={gallery.shareToken}
        />
        {children}
      </main>
    </div>
  )
}
