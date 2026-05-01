import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { PhotoRepository } from '@/src/modules/photos/repositories/PhotoRepository'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: galleryId } = await params
    const photographerId    = await getAuthenticatedPhotographer()

    const gallery = await GalleryService.getDetail(galleryId, photographerId)
    if (!gallery) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    if (!Array.isArray(body.photoIds) || body.photoIds.some((id: unknown) => typeof id !== 'string' || !UUID_RE.test(id))) {
      return NextResponse.json({ error: 'photoIds must be an array of UUIDs' }, { status: 400 })
    }

    await PhotoRepository.reorderPhotos(galleryId, body.photoIds as string[])
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const status  = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status })
  }
}
