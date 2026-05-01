import { NextRequest, NextResponse } from 'next/server'
import { FavoriteService } from '../services/FavoriteService'

function clientToken(req: NextRequest): string | undefined {
  return req.headers.get('x-client-token') ?? undefined
}

function handleError(err: unknown): NextResponse {
  const status  = (err as { status?: number }).status ?? 500
  const message = err instanceof Error ? err.message : 'Failed'
  if (status < 500) return NextResponse.json({ error: message }, { status })
  console.error('[favorites]', err)
  return NextResponse.json({ error: 'Failed' }, { status: 500 })
}

// GET /api/galleries/[id]/favorites — current client's favorited photo IDs
export async function handleGetFavorites(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: galleryId } = await params
  try {
    const result = await FavoriteService.getForClient(galleryId, clientToken(req))
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}

// POST /api/galleries/[id]/favorites — toggle a photo favorite
export async function handleToggleFavorite(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: galleryId } = await params

  const body = await req.json().catch(() => ({}))
  const photoId = body?.photoId as string | undefined
  if (!photoId || typeof photoId !== 'string') {
    return NextResponse.json({ error: 'photoId is required' }, { status: 400 })
  }

  try {
    const result = await FavoriteService.toggle(galleryId, photoId, clientToken(req))
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
