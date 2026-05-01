import { NextRequest, NextResponse } from 'next/server'
import { DownloadService } from '../services/DownloadService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

function handleError(err: unknown): NextResponse {
  const status  = (err as { status?: number }).status ?? 500
  const message = err instanceof Error ? err.message : 'Internal error'
  if (status < 500) return NextResponse.json({ error: message }, { status })
  console.error('[downloads]', err)
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}

// GET /api/photos/[id]/download — single photo signed URL (photographer only)
export async function handleGetDownloadUrl(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id: photoId } = await params
  try {
    return NextResponse.json(await DownloadService.getDownloadUrl(photoId, photographerId))
  } catch (err) {
    return handleError(err)
  }
}

// POST /api/galleries/[id]/downloads — request ZIP job
export async function handleRequestZip(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: galleryId } = await params
  const clientToken = req.headers.get('x-client-token') ?? undefined
  try {
    const result = await DownloadService.requestZip(galleryId, clientToken)
    return NextResponse.json(result, { status: 202 })
  } catch (err) {
    return handleError(err)
  }
}

// GET /api/galleries/[id]/downloads/[downloadId] — poll ZIP status
export async function handleGetZipStatus(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; downloadId: string }> },
): Promise<NextResponse> {
  const { downloadId } = await params
  try {
    return NextResponse.json(await DownloadService.getZipStatus(downloadId))
  } catch (err) {
    return handleError(err)
  }
}
