import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { ImportKeyService } from '../services/ImportKeyService'

function err401() { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

export async function handleListKeys(_req: NextRequest): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() } catch { return err401() }

  const keys = await ImportKeyService.list(photographerId)
  return NextResponse.json({ keys })
}

export async function handleCreateKey(req: NextRequest): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() } catch { return err401() }

  const body             = await req.json().catch(() => ({}))
  const defaultGalleryId = String(body?.defaultGalleryId ?? '').trim() || undefined
  const label            = typeof body?.label === 'string' ? body.label.trim() : undefined

  try {
    const result = await ImportKeyService.create(photographerId, defaultGalleryId, label || undefined)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 404) return NextResponse.json({ error: e.message }, { status: 404 })
    console.error('[import-keys POST]', err)
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })
  }
}

export async function handleRevokeKey(
  _req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() } catch { return err401() }

  const { keyId } = await params
  try {
    await ImportKeyService.revoke(keyId, photographerId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 404) return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    console.error('[import-keys DELETE]', err)
    return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 })
  }
}
