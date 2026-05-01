import { NextRequest, NextResponse } from 'next/server'
import { WatermarkService } from '../services/WatermarkService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

function authError() { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
function notFound()  { return NextResponse.json({ error: 'Not found' },    { status: 404 }) }

// GET /api/watermarks
export async function handleListWatermarks(): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  try {
    const presets = await WatermarkService.list(photographerId)
    return NextResponse.json({ presets })
  } catch (err) {
    console.error('[watermarks GET]', err)
    return NextResponse.json({ error: 'Failed to load watermarks' }, { status: 500 })
  }
}

// POST /api/watermarks
export async function handleCreateWatermark(req: NextRequest): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  try {
    const preset = await WatermarkService.create(photographerId, body as Parameters<typeof WatermarkService.create>[1])
    return NextResponse.json(preset, { status: 201 })
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 400) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[watermarks POST]', err)
    return NextResponse.json({ error: 'Failed to create watermark' }, { status: 500 })
  }
}

// GET /api/watermarks/[id]
export async function handleGetWatermark(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  const { id } = await params
  try {
    const preset = await WatermarkService.get(id, photographerId)
    return NextResponse.json(preset)
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 404) return notFound()
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('[watermarks/:id GET]', err)
    return NextResponse.json({ error: 'Failed to load watermark' }, { status: 500 })
  }
}

// PATCH /api/watermarks/[id]
export async function handleUpdateWatermark(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  const { id } = await params
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  try {
    const preset = await WatermarkService.update(id, photographerId, body)
    return NextResponse.json(preset)
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 404) return notFound()
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (e.status === 400) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[watermarks/:id PATCH]', err)
    return NextResponse.json({ error: 'Failed to update watermark' }, { status: 500 })
  }
}

// DELETE /api/watermarks/[id]
export async function handleDeleteWatermark(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  const { id } = await params
  try {
    await WatermarkService.delete(id, photographerId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 404) return notFound()
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('[watermarks/:id DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete watermark' }, { status: 500 })
  }
}

// POST /api/watermarks/image  (multipart upload)
export async function handleUploadWatermarkImage(req: NextRequest): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  let formData: FormData
  try { formData = await req.formData() }
  catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }) }

  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 })

  try {
    const key = await WatermarkService.uploadImage(photographerId, file)
    return NextResponse.json({ key }, { status: 201 })
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 400) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[watermarks/image POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
