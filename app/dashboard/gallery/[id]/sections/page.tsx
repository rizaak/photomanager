import { notFound } from 'next/navigation'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { GallerySectionsClient } from '@/components/gallery/GallerySectionsClient'

export default async function GallerySectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }         = await params
  const photographerId = await getAuthenticatedPhotographer()
  const gallery        = await GalleryService.getDetail(id, photographerId)

  if (!gallery) notFound()

  return <GallerySectionsClient galleryId={id} />
}
