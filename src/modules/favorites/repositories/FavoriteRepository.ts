import { prisma } from '../../../infrastructure/database/db'

export const FavoriteRepository = {
  /** Toggle a photo favorite for a client. Returns the new state. */
  async toggle(galleryClientId: string, galleryId: string, photoId: string): Promise<boolean> {
    const existing = await prisma.favorite.findUnique({
      where: { galleryClientId_photoId: { galleryClientId, photoId } },
      select: { id: true },
    })

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      return false // unfavorited
    }

    await prisma.favorite.create({ data: { galleryClientId, galleryId, photoId } })
    return true // favorited
  },

  /** Get all favorited photo IDs for a client in a gallery. */
  async findPhotoIds(galleryClientId: string, galleryId: string): Promise<string[]> {
    const rows = await prisma.favorite.findMany({
      where:  { galleryClientId, galleryId },
      select: { photoId: true },
    })
    return rows.map((r) => r.photoId)
  },

  /** Count per-photo favorites across all clients in a gallery (for photographer view). */
  async countsByPhoto(galleryId: string): Promise<{ photoId: string; count: number }[]> {
    const rows = await prisma.favorite.groupBy({
      by:      ['photoId'],
      where:   { galleryId },
      _count:  { photoId: true },
      orderBy: { _count: { photoId: 'desc' } },
    })
    return rows.map((r) => ({ photoId: r.photoId, count: r._count.photoId }))
  },
}
