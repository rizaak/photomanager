import { prisma } from '../../../infrastructure/database/db'
import { GalleryService } from '../../galleries/services/GalleryService'
import { GallerySectionRepository } from '../../galleries/repositories/GallerySectionRepository'

interface CreateSetInput {
  title:            string
  clientId?:        string  // undefined = all clients' favorites
  visibleToClient:  boolean
  watermarkEnabled: boolean
}

export const FavoriteSetService = {
  async createFromFavorites(
    galleryId:      string,
    photographerId: string,
    input:          CreateSetInput,
  ) {
    const gallery = await GalleryService.getDetail(galleryId, photographerId)
    if (!gallery) throw Object.assign(new Error('Gallery not found'), { status: 404 })

    // Verify clientId belongs to this gallery when specified
    if (input.clientId) {
      const client = await prisma.galleryClient.findUnique({
        where:  { id: input.clientId },
        select: { galleryId: true },
      })
      if (!client || client.galleryId !== galleryId) {
        throw Object.assign(new Error('Client not found'), { status: 404 })
      }
    }

    const favs = await prisma.favorite.findMany({
      where:    { galleryId, ...(input.clientId && { galleryClientId: input.clientId }) },
      select:   { photoId: true },
      distinct: ['photoId'],
    })

    if (favs.length === 0) {
      throw Object.assign(new Error('No favorited photos for this selection'), { status: 422 })
    }

    const photoIds = favs.map((f) => f.photoId)
    const count    = await GallerySectionRepository.countByGallery(galleryId)

    const section = await GallerySectionRepository.create(
      galleryId,
      input.title.trim(),
      count,
      input.visibleToClient,
      input.watermarkEnabled,
    )

    await prisma.photo.updateMany({
      where: { id: { in: photoIds }, galleryId },
      data:  { sectionId: section.id },
    })

    return { section, photoCount: photoIds.length }
  },
}
