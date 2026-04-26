import { NextRequest, NextResponse } from 'next/server'
import { GalleryPhotosService } from '../services/GalleryPhotosService'

export async function handleGetGalleryPhotos(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  try {
    const data = await GalleryPhotosService.getForGallery(id)
    if (!data) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[galleryPhotos]', err)
    return NextResponse.json({ error: 'Failed to load gallery' }, { status: 500 })
  }
}
