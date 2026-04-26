import { NextRequest, NextResponse } from 'next/server'
import { ActivityService } from '../services/ActivityService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

// GET /api/galleries/[id]/activity
export async function handleGetActivity(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id } = await params
  try {
    const events = await ActivityService.getForGallery(id, photographerId)
    return NextResponse.json({ events })
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('[activity GET]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
