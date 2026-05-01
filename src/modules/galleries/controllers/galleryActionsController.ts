import { NextRequest, NextResponse } from 'next/server'
import { GalleryService } from '../services/GalleryService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

function authError() { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
function notFound()  { return NextResponse.json({ error: 'Not found' },    { status: 404 }) }

// DELETE /api/galleries/[id]
export async function handleDeleteGallery(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  const { id } = await params
  try {
    await GalleryService.deleteGallery(id, photographerId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 404) return notFound()
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('[gallery DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete gallery' }, { status: 500 })
  }
}

// POST /api/galleries/[id]/duplicate
export async function handleDuplicateGallery(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  const { id } = await params
  try {
    const gallery = await GalleryService.duplicateGallery(id, photographerId)
    return NextResponse.json(gallery, { status: 201 })
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 404) return notFound()
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('[gallery duplicate POST]', err)
    return NextResponse.json({ error: 'Failed to duplicate gallery' }, { status: 500 })
  }
}
