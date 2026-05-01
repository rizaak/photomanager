import { NextRequest, NextResponse } from 'next/server'
import { CommentService } from '../services/CommentService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

function clientToken(req: NextRequest): string | undefined {
  return req.headers.get('x-client-token') ?? undefined
}

function handleError(err: unknown): NextResponse {
  const status  = (err as { status?: number }).status ?? 500
  const message = err instanceof Error ? err.message : 'Failed'
  if (status < 500) return NextResponse.json({ error: message }, { status })
  console.error('[comments]', err)
  return NextResponse.json({ error: 'Failed' }, { status: 500 })
}

// GET /api/galleries/[id]/comments — photographer view (requires auth)
export async function handleListComments(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id: galleryId } = await params
  try {
    const comments = await CommentService.listForGallery(galleryId, photographerId)
    return NextResponse.json({ comments })
  } catch (err) {
    return handleError(err)
  }
}

// POST /api/galleries/[id]/comments — client posts a comment (x-client-token)
export async function handleAddComment(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: galleryId } = await params
  const body = await req.json().catch(() => ({}))
  const text    = body?.body    as string | undefined
  const photoId = body?.photoId as string | undefined

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'body is required' }, { status: 400 })
  }

  try {
    const comment = await CommentService.addComment(galleryId, text, clientToken(req), photoId)
    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}

// PATCH /api/galleries/[id]/comments/[commentId] — client edits own comment
export async function handleUpdateComment(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
): Promise<NextResponse> {
  const { id: galleryId, commentId } = await params
  const body = await req.json().catch(() => ({}))
  const text = body?.body as string | undefined

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'body is required' }, { status: 400 })
  }

  try {
    const comment = await CommentService.updateComment(commentId, galleryId, text, clientToken(req))
    return NextResponse.json(comment)
  } catch (err) {
    return handleError(err)
  }
}

// DELETE /api/galleries/[id]/comments/[commentId] — client deletes own comment
export async function handleDeleteComment(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
): Promise<NextResponse> {
  const { id: galleryId, commentId } = await params
  try {
    await CommentService.deleteComment(commentId, galleryId, clientToken(_req))
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleError(err)
  }
}
