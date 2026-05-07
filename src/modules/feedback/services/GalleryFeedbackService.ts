import { prisma } from '../../../infrastructure/database/db'
import { GalleryService } from '../../galleries/services/GalleryService'
import { storageProvider } from '../../../infrastructure/storage/StorageProvider'

const URL_EXPIRY = 3600

export const GalleryFeedbackService = {
  async getForGallery(galleryId: string, photographerId: string) {
    const gallery = await GalleryService.getDetail(galleryId, photographerId)
    if (!gallery) throw Object.assign(new Error('Not found'), { status: 404 })

    const clients = await prisma.galleryClient.findMany({
      where:   { galleryId },
      orderBy: { createdAt: 'desc' },
      select: {
        id:    true,
        name:  true,
        email: true,
        favorites: {
          orderBy: { createdAt: 'desc' },
          select: {
            photoId:   true,
            createdAt: true,
            photo: { select: { thumbnailKey: true } },
          },
        },
        comments: {
          where:   { photoId: { not: null } },
          orderBy: { createdAt: 'asc' },
          select: {
            id:        true,
            body:      true,
            photoId:   true,
            createdAt: true,
            photo: { select: { thumbnailKey: true, filename: true } },
          },
        },
      },
    })

    const active = clients.filter(c => c.favorites.length > 0 || c.comments.length > 0)

    // Batch-sign all unique thumbnail keys in one pass
    const allKeys = new Set<string>()
    for (const c of active) {
      for (const f of c.favorites) if (f.photo.thumbnailKey) allKeys.add(f.photo.thumbnailKey)
      for (const cm of c.comments)  if (cm.photo?.thumbnailKey) allKeys.add(cm.photo.thumbnailKey)
    }

    const signed = new Map<string, string>()
    await Promise.all([...allKeys].map(async key => {
      signed.set(key, await storageProvider.getSignedUrl(key, URL_EXPIRY))
    }))

    const url = (key: string | null | undefined) => (key ? (signed.get(key) ?? null) : null)

    return active.map(c => ({
      id:    c.id,
      name:  c.name,
      email: c.email,
      favorites: c.favorites.map(f => ({
        photoId:      f.photoId,
        thumbnailUrl: url(f.photo.thumbnailKey),
        createdAt:    f.createdAt.toISOString(),
      })),
      comments: c.comments.map(cm => ({
        id:            cm.id,
        photoId:       cm.photoId!,
        body:          cm.body,
        photoFilename: cm.photo?.filename ?? null,
        thumbnailUrl:  url(cm.photo?.thumbnailKey),
        createdAt:     cm.createdAt.toISOString(),
      })),
    }))
  },
}
