import { EditStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { PhotoService } from '../services/PhotoService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

const ALLOWED = new Set<string>(['NONE', 'EDITING', 'FINAL_READY'])

export async function handleUpdateEditStatus(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id: photoId } = await params
  const body = await req.json().catch(() => ({}))
  const editStatus = body?.editStatus as string | undefined

  if (!editStatus || !ALLOWED.has(editStatus)) {
    return NextResponse.json(
      { error: `editStatus must be one of: ${[...ALLOWED].join(', ')}` },
      { status: 400 },
    )
  }

  try {
    await PhotoService.updateEditStatus(photoId, editStatus as EditStatus, photographerId)
    return NextResponse.json({ ok: true, editStatus })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status })
  }
}
