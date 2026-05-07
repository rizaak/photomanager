import { notFound } from 'next/navigation'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { GalleryAccessService } from '@/src/modules/galleries/services/GalleryAccessService'
import { GalleryPreviewClient } from '@/components/gallery/GalleryPreviewClient'

/**
 * Photographer-only gallery preview.
 *
 * Protected by:
 *   1. Auth0 middleware (all /dashboard routes require a session)
 *   2. GalleryService.getDetail — ownership enforced by photographerId
 *
 * Draft galleries are accessible to their owner via the photographerId bypass
 * in GalleryAccessService. Clients and unauthenticated visitors cannot reach
 * this route at all.
 */
export default async function GalleryPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }         = await params
  const photographerId = await getAuthenticatedPhotographer()

  // Verify ownership — returns null for non-owners and non-existent galleries
  const gallery = await GalleryService.getDetail(id, photographerId)
  if (!gallery) notFound()

  // Resolve full presentation data using the photographer bypass so draft
  // galleries are accessible. This call is server-side only — the bypass
  // is never exposed through any public API endpoint.
  const result = await GalleryAccessService.resolveAccess(gallery.shareToken, { photographerId })
  if (result.gate !== 'open') notFound()

  return (
    <GalleryPreviewClient
      galleryId={result.access.id}
      title={result.access.title}
      subtitle={result.access.subtitle}
      eventDate={result.access.eventDate}
      coverPhotoId={result.access.coverPhotoId}
      coverStyle={result.access.coverStyle as 'fullscreen' | 'split' | 'minimal'}
      galleryLayout={result.access.galleryLayout as 'masonry' | 'editorial' | 'uniform'}
      typographyStyle={result.access.typographyStyle}
      colorTheme={result.access.colorTheme as 'dark' | 'light' | 'warm'}
    />
  )
}
