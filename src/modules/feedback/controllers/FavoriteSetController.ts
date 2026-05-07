import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { FavoriteSetService } from '../services/FavoriteSetService'

type Ctx = { params: Promise<{ id: string }> }

export async function handleCreateSetFromFavorites(req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const title            = String(body?.title ?? '').trim()
  const clientId         = typeof body?.clientId === 'string' && body.clientId ? body.clientId : undefined
  const visibleToClient  = typeof body?.visibleToClient  === 'boolean' ? body.visibleToClient  : true
  const watermarkEnabled = typeof body?.watermarkEnabled === 'boolean' ? body.watermarkEnabled : true

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  try {
    const result = await FavoriteSetService.createFromFavorites(id, photographerId, {
      title,
      clientId,
      visibleToClient,
      watermarkEnabled,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 404) return NextResponse.json({ error: e.message ?? 'Not found' }, { status: 404 })
    if (e.status === 422) return NextResponse.json({ error: e.message }, { status: 422 })
    console.error('[create-set-from-favorites]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
