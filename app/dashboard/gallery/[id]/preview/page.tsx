import { notFound, redirect } from 'next/navigation'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'

/**
 * Photographer preview entry point.
 *
 * Protected by:
 *  1. The middleware (all /dashboard routes require an Auth0 session).
 *  2. GalleryService.getDetail which enforces photographerId ownership — a
 *     photographer can only preview their own galleries.
 *
 * Once ownership is confirmed server-side, redirects to the public gallery
 * with ?preview=1 so the client-side page can display the preview banner
 * and skip client-activity logging.
 */
export default async function GalleryPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }         = await params
  const photographerId = await getAuthenticatedPhotographer()
  const gallery        = await GalleryService.getDetail(id, photographerId)

  if (!gallery) notFound()

  // Redirect to the public gallery in preview mode. The ?preview=1 flag is an
  // internal signal — the access-resolution endpoint validates the Auth0 session
  // and photographer ownership before honouring it. Clients visiting the public
  // share link without a valid session cannot activate preview mode.
  redirect(`/gallery/${gallery.shareToken}?preview=1`)
}
