import { NextRequest, NextResponse } from 'next/server'
import { PhotoService } from '../services/PhotoService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

export async function handleAssignSection(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  // sectionId can be a string (assign) or null (remove from section)
  const sectionId: string | null = body?.sectionId ?? null

  try {
    await PhotoService.assignSection(id, sectionId, photographerId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status })
  }
}
