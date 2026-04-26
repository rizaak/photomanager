import { NextRequest, NextResponse } from 'next/server'
import { GalleryService } from '../services/GalleryService'
import { GalleryAccessService } from '../services/GalleryAccessService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

// GET /api/galleries
export async function handleListGalleries(): Promise<NextResponse> {
  try {
    const photographerId = await getAuthenticatedPhotographer()
    const galleries = await GalleryService.listGalleries(photographerId)
    return NextResponse.json({ galleries })
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[galleries GET]', err)
    return NextResponse.json({ error: 'Failed to load galleries' }, { status: 500 })
  }
}

// POST /api/galleries
export async function handleCreateGallery(req: NextRequest): Promise<NextResponse> {
  let photographerId: string
  try {
    photographerId = await getAuthenticatedPhotographer()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { title?: string; clientName?: string; clientEmail?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.title?.trim() || !body.clientName?.trim()) {
    return NextResponse.json({ error: 'title and clientName are required' }, { status: 400 })
  }

  try {
    const gallery = await GalleryService.createGallery(
      {
        title:       body.title.trim(),
        clientName:  body.clientName.trim(),
        clientEmail: body.clientEmail?.trim() || undefined,
        password:    body.password?.trim() || undefined,
      },
      photographerId,
    )
    return NextResponse.json(gallery, { status: 201 })
  } catch (err) {
    console.error('[galleries POST]', err)
    return NextResponse.json({ error: 'Failed to create gallery' }, { status: 500 })
  }
}

// POST /api/galleries/by-token/[token]  — validates password + client registration, returns access config
export async function handleResolveGalleryAccess(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params

  let body: {
    password?:    string
    clientToken?: string
    name?:        string
    email?:       string
  } = {}
  try { body = await req.json() } catch { /* no body */ }

  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)

  try {
    const result = await GalleryAccessService.resolveAccess(token, {
      password:    str(body.password),
      clientToken: str(body.clientToken),
      name:        str(body.name),
      email:       str(body.email),
    })

    switch (result.gate) {
      case 'open':
        return NextResponse.json(result.access)
      case 'password_required':
        return NextResponse.json({ code: 'PASSWORD_REQUIRED' }, { status: 401 })
      case 'wrong_password':
        return NextResponse.json({ code: 'WRONG_PASSWORD' }, { status: 401 })
      case 'registration_required':
        return NextResponse.json({ code: 'REGISTRATION_REQUIRED' }, { status: 403 })
    }
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 404) return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    if (e.status === 400) {
      const msg = err instanceof Error ? err.message : 'Bad request'
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    console.error('[galleries by-token POST]', err)
    return NextResponse.json({ error: 'Failed to resolve gallery' }, { status: 500 })
  }
}
