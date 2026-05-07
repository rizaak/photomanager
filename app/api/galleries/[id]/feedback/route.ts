export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { GalleryFeedbackService } from '@/src/modules/feedback/services/GalleryFeedbackService'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id } = await params
  try {
    const data = await GalleryFeedbackService.getForGallery(id, photographerId)
    return NextResponse.json(data)
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (e.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    console.error('[gallery feedback]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
