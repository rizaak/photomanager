import { NextRequest, NextResponse } from 'next/server'
import { PhotoService } from '../services/PhotoService'
import { GalleryService } from '../../galleries/services/GalleryService'
import { getAuthenticatedPhotographer } from '../../auth/utils/getAuthenticatedPhotographer'

export async function handleUpload(req: NextRequest): Promise<NextResponse> {
  // Must be an authenticated photographer
  let photographerId: string
  try {
    photographerId = await getAuthenticatedPhotographer()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart request' }, { status: 400 })
  }

  const galleryId = formData.get('galleryId')
  if (!galleryId || typeof galleryId !== 'string' || galleryId.trim() === '') {
    return NextResponse.json({ error: 'galleryId is required' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const trimmedGalleryId = galleryId.trim()

  // Verify gallery exists and belongs to this photographer
  const gallery = await GalleryService.getDetail(trimmedGalleryId, photographerId)
  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
  }

  try {
    const result = await PhotoService.upload(file, trimmedGalleryId, photographerId)
    return NextResponse.json({ photoId: result.photoId, status: 'queued' })
  } catch (err) {
    const status  = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Upload failed'
    if (status < 500) return NextResponse.json({ error: message }, { status })
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
