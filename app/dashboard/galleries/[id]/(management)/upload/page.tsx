import { notFound } from 'next/navigation'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GalleryUploadClient } from '@/components/upload/GalleryUploadClient'

export default async function GalleryUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const photographerId = await getAuthenticatedPhotographer()
  const gallery = await GalleryService.getDetail(id, photographerId)

  if (!gallery) notFound()

  return <GalleryUploadClient galleryId={id} galleryTitle={gallery.title} />
}
