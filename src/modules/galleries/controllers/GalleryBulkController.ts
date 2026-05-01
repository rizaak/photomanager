import { NextRequest, NextResponse } from 'next/server'
import { GalleryBulkService, BulkAction } from '../services/GalleryBulkService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

function authError() { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

// POST /api/galleries/bulk
export async function handleBulkAction(req: NextRequest): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  let body: { galleryIds?: unknown; action?: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { galleryIds, action } = body
  if (!Array.isArray(galleryIds) || !action || typeof action !== 'object')
    return NextResponse.json({ error: 'galleryIds (array) and action (object) are required' }, { status: 400 })

  if (galleryIds.some((id) => typeof id !== 'string'))
    return NextResponse.json({ error: 'galleryIds must be strings' }, { status: 400 })

  try {
    const result = await GalleryBulkService.apply(photographerId, galleryIds as string[], action as BulkAction)
    return NextResponse.json(result)
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 400) return NextResponse.json({ error: e.message }, { status: 400 })
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (e.status === 404) return NextResponse.json({ error: e.message }, { status: 404 })
    console.error('[galleries/bulk POST]', err)
    return NextResponse.json({ error: 'Bulk action failed' }, { status: 500 })
  }
}
