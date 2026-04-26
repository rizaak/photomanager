import { NextRequest, NextResponse } from 'next/server'
import { GallerySettingsService } from '../services/GallerySettingsService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

// GET /api/galleries/[id]/settings
export async function handleGetSettings(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id } = await params
  try {
    const settings = await GallerySettingsService.getSettings(id, photographerId)
    return NextResponse.json(settings)
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('[gallery settings GET]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PATCH /api/galleries/[id]/settings
export async function handleUpdateSettings(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id } = await params
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  try {
    const settings = await GallerySettingsService.updateSettings(id, photographerId, body)
    return NextResponse.json(settings)
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (e.status === 400) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[gallery settings PATCH]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
