import { NextRequest, NextResponse } from 'next/server'
import { ClientService } from '../services/ClientService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'
import { GalleryService } from '../../galleries/services/GalleryService'

// GET /api/galleries/[id]/clients  — photographer only
export async function handleListClients(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: galleryId } = await params

  let photographerId: string
  try {
    photographerId = await getAuthenticatedPhotographer()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ownership guard — getDetail returns null if photographer doesn't own the gallery
  const gallery = await GalleryService.getDetail(galleryId, photographerId)
  if (!gallery) return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })

  try {
    const clients = await ClientService.listForGallery(galleryId)
    return NextResponse.json({ clients })
  } catch (err) {
    console.error('[clients GET]', err)
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 })
  }
}
