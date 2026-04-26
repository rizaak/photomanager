import { NextRequest, NextResponse } from 'next/server'
import { PresetService } from '../services/PresetService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

function authErr() { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

// GET /api/presets
export async function handleListPresets(): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authErr() }

  const presets = await PresetService.list(photographerId)
  return NextResponse.json({ presets })
}

// POST /api/presets
export async function handleCreatePreset(req: NextRequest): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authErr() }

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  try {
    const preset = await PresetService.create(photographerId, body)
    return NextResponse.json(preset, { status: 201 })
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 400) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[presets POST]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PATCH /api/presets/[id]
export async function handleUpdatePreset(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authErr() }

  const { id } = await params
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  try {
    const preset = await PresetService.update(id, photographerId, body)
    return NextResponse.json(preset)
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (e.status === 400) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[presets PATCH]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// DELETE /api/presets/[id]
export async function handleDeletePreset(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authErr() }

  const { id } = await params
  try {
    await PresetService.delete(id, photographerId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('[presets DELETE]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
