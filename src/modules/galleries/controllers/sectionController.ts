import { NextRequest, NextResponse } from 'next/server'
import { GallerySectionService } from '../services/GallerySectionService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

async function auth(): Promise<string> {
  return getAuthenticatedPhotographer()
}

function err401() { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

export async function handleListSections(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await auth() } catch { return err401() }
  const { id } = await params
  const sections = await GallerySectionService.listSections(id, photographerId)
  return NextResponse.json({ sections })
}

export async function handleCreateSection(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await auth() } catch { return err401() }
  const { id } = await params
  const body  = await req.json().catch(() => ({}))
  const title = (body?.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  try {
    const section = await GallerySectionService.createSection(id, photographerId, title)
    return NextResponse.json(section, { status: 201 })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status })
  }
}

export async function handleUpdateSection(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await auth() } catch { return err401() }
  const { id, sectionId } = await params
  const body  = await req.json().catch(() => ({}))
  const title = (body?.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  try {
    const section = await GallerySectionService.renameSection(sectionId, id, photographerId, title)
    return NextResponse.json(section)
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status })
  }
}

export async function handleDeleteSection(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await auth() } catch { return err401() }
  const { id, sectionId } = await params
  try {
    await GallerySectionService.deleteSection(sectionId, id, photographerId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status })
  }
}
