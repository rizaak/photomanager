import { GalleryEventType, Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'

export const ActivityRepository = {
  async log(galleryId: string, eventType: GalleryEventType, metadata?: Record<string, unknown>) {
    await prisma.galleryActivityEvent.create({
      data: {
        galleryId,
        eventType,
        metadata: metadata != null ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    })
  },

  async findByGallery(galleryId: string, limit = 50) {
    return prisma.galleryActivityEvent.findMany({
      where:   { galleryId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      select: {
        id:        true,
        eventType: true,
        metadata:  true,
        createdAt: true,
      },
    })
  },
}
