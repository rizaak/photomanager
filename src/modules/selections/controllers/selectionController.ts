import { NextRequest, NextResponse } from 'next/server'
import { SelectionService } from '../services/SelectionService'

function clientToken(req: NextRequest): string | undefined {
  return req.headers.get('x-client-token') ?? undefined
}

export async function handleGetSelection(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: galleryId } = await params
  try {
    const data = await SelectionService.getForGallery(galleryId, clientToken(req))
    return NextResponse.json(data)
  } catch (err) {
    console.error('[selection GET]', err)
    return NextResponse.json({ error: 'Failed to load selection' }, { status: 500 })
  }
}

export async function handleSubmitSelection(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: galleryId } = await params
  try {
    const result = await SelectionService.submitSelection(galleryId, clientToken(req))
    return NextResponse.json(result)
  } catch (err) {
    const status  = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Failed to submit selection'
    if (status < 500) return NextResponse.json({ error: message }, { status })
    console.error('[selection submit]', err)
    return NextResponse.json({ error: 'Failed to submit selection' }, { status: 500 })
  }
}

export async function handleToggleSelection(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: galleryId } = await params

  let photoId: string
  try {
    const body = await req.json()
    photoId = body.photoId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!photoId || typeof photoId !== 'string') {
    return NextResponse.json({ error: 'photoId is required' }, { status: 400 })
  }

  try {
    const result = await SelectionService.togglePhoto(galleryId, photoId, clientToken(req))
    return NextResponse.json(result)
  } catch (err) {
    const status  = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Failed to update selection'
    if (status < 500) return NextResponse.json({ error: message }, { status })
    console.error('[selection toggle]', err)
    return NextResponse.json({ error: 'Failed to update selection' }, { status: 500 })
  }
}
