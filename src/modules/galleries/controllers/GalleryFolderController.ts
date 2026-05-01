import { NextRequest, NextResponse } from 'next/server'
import { GalleryFolderService } from '../services/GalleryFolderService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

function authError() { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
function notFound()  { return NextResponse.json({ error: 'Not found' },    { status: 404 }) }

// GET /api/folders
export async function handleListFolders(): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  try {
    const folders = await GalleryFolderService.list(photographerId)
    return NextResponse.json({ folders })
  } catch (err) {
    console.error('[folders GET]', err)
    return NextResponse.json({ error: 'Failed to load folders' }, { status: 500 })
  }
}

// POST /api/folders
export async function handleCreateFolder(req: NextRequest): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  let body: { name?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  try {
    const folder = await GalleryFolderService.create(photographerId, body.name ?? '')
    return NextResponse.json(folder, { status: 201 })
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 400) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[folders POST]', err)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}

// PATCH /api/folders/[id]
export async function handleRenameFolder(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  const { id } = await params
  let body: { name?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  try {
    const folder = await GalleryFolderService.rename(id, photographerId, body.name ?? '')
    return NextResponse.json(folder)
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e.status === 404) return notFound()
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (e.status === 400) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[folders/:id PATCH]', err)
    return NextResponse.json({ error: 'Failed to rename folder' }, { status: 500 })
  }
}

// DELETE /api/folders/[id]
export async function handleDeleteFolder(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return authError() }

  const { id } = await params
  try {
    await GalleryFolderService.delete(id, photographerId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 404) return notFound()
    if (e.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('[folders/:id DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}
