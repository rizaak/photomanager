import { NextRequest, NextResponse } from 'next/server'
import { FinalDownloadService } from '../services/FinalDownloadService'

// GET /api/galleries/[id]/finals
export async function handleGetFinals(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: galleryId } = await params
  const clientToken = req.headers.get('x-client-token') ?? undefined

  try {
    const items = await FinalDownloadService.getFinalDownloads(galleryId, clientToken)
    return NextResponse.json({ photos: items })
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 404) return NextResponse.json({ error: e.message }, { status: 404 })
    if (e.status === 403) return NextResponse.json({ error: e.message }, { status: 403 })
    console.error('[finals GET]', err)
    return NextResponse.json({ error: 'Failed to generate download links' }, { status: 500 })
  }
}
