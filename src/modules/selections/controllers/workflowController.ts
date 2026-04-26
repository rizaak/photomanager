import { SelectionWorkflow } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { WorkflowService } from '../services/WorkflowService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

const ALLOWED_STATES = new Set<string>([
  'IN_REVIEW', 'EDITING', 'DELIVERED',
])

export async function handleAdvanceWorkflow(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id: galleryId } = await params
  const body = await req.json().catch(() => ({}))
  const state = body?.state as string | undefined

  if (!state || !ALLOWED_STATES.has(state)) {
    return NextResponse.json(
      { error: `state must be one of: ${[...ALLOWED_STATES].join(', ')}` },
      { status: 400 },
    )
  }

  try {
    await WorkflowService.advanceWorkflow(galleryId, photographerId, state as SelectionWorkflow)
    return NextResponse.json({ ok: true, state })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status })
  }
}
