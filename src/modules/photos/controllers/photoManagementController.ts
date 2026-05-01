import { NextRequest, NextResponse } from 'next/server'
import { EditStatus } from '@prisma/client'
import { PhotoService } from '../services/PhotoService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

function authErr()  { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
function notFound() { return NextResponse.json({ error: 'Not found' },    { status: 404 }) }

function handleServiceError(err: unknown): NextResponse {
  const e = err as { status?: number; message?: string }
  if (e.status === 401) return authErr()
  if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (e.status === 404) return notFound()
  if (e.status === 400 || e.status === 422) return NextResponse.json({ error: e.message ?? 'Bad request' }, { status: e.status })
  console.error('[photo management]', err)
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}

// DELETE /api/photos/[id]
export async function handleDeletePhoto(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authErr() }

  const { id } = await params
  try {
    await PhotoService.deletePhoto(id, photographerId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleServiceError(err)
  }
}

// POST /api/photos/[id]/watermark
export async function handleApplyWatermark(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authErr() }

  const { id } = await params
  let body: { presetId?: string | null; remove?: boolean } = {}
  try { body = await req.json() } catch { /* no body */ }

  try {
    await PhotoService.applyWatermark(id, photographerId, body.presetId, body.remove ?? false)
    return NextResponse.json({ queued: true })
  } catch (err) {
    return handleServiceError(err)
  }
}

// PATCH /api/photos/[id]/labels
export async function handleUpdateLabels(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authErr() }

  const { id } = await params
  let body: { labels?: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  if (!Array.isArray(body.labels)) {
    return NextResponse.json({ error: 'labels must be an array' }, { status: 400 })
  }

  try {
    await PhotoService.updateLabels(id, photographerId, body.labels as string[])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleServiceError(err)
  }
}

// POST /api/photos/bulk
export async function handleBulkAction(req: NextRequest): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authErr() }

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const photoIds = body.photoIds
  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return NextResponse.json({ error: 'photoIds is required' }, { status: 400 })
  }

  const action = body.action as string
  if (!action) return NextResponse.json({ error: 'action is required' }, { status: 400 })

  try {
    switch (action) {
      case 'move_section':
        await PhotoService.bulkMoveToSection(
          photoIds,
          photographerId,
          typeof body.sectionId === 'string' ? body.sectionId : null,
        )
        break

      case 'apply_watermark':
        await PhotoService.bulkApplyWatermark(
          photoIds,
          photographerId,
          typeof body.presetId === 'string' ? body.presetId : null,
          body.remove === true,
        )
        break

      case 'add_labels':
        await PhotoService.bulkUpdateLabels(
          photoIds, photographerId,
          Array.isArray(body.labels) ? body.labels as string[] : [],
          [],
        )
        break

      case 'remove_labels':
        await PhotoService.bulkUpdateLabels(
          photoIds, photographerId,
          [],
          Array.isArray(body.labels) ? body.labels as string[] : [],
        )
        break

      case 'edit_status': {
        const es = body.editStatus as string
        if (!['NONE', 'EDITING', 'FINAL_READY'].includes(es)) {
          return NextResponse.json({ error: 'Invalid editStatus' }, { status: 400 })
        }
        await PhotoService.bulkEditStatus(photoIds, photographerId, es as EditStatus)
        break
      }

      case 'delete':
        await PhotoService.bulkDelete(photoIds, photographerId)
        break

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleServiceError(err)
  }
}
