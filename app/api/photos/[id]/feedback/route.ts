export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedPhotographer } from '@/src/modules/auth/utils/getAuthenticatedPhotographer'
import { PhotoRepository } from '@/src/modules/photos/repositories/PhotoRepository'
import { GalleryService } from '@/src/modules/galleries/services/GalleryService'
import { CommentRepository } from '@/src/modules/comments/repositories/CommentRepository'
import { FavoriteRepository } from '@/src/modules/favorites/repositories/FavoriteRepository'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/photos/[id]/feedback — photographer-only
export async function GET(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  let photographerId: string
  try { photographerId = await getAuthenticatedPhotographer() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id: photoId } = await params

  const photo = await PhotoRepository.findById(photoId)
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const gallery = await GalleryService.getDetail(photo.galleryId, photographerId)
  if (!gallery) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [comments, favorites] = await Promise.all([
    CommentRepository.findByPhoto(photo.galleryId, photoId),
    FavoriteRepository.findByPhoto(photo.galleryId, photoId),
  ])

  return NextResponse.json({ comments, favorites })
}
