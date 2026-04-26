import { GalleryStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'

export const PhotographerRepository = {
  async findWithPlan(photographerId: string) {
    return prisma.photographerProfile.findUnique({
      where:  { id: photographerId },
      select: {
        storageUsedBytes: true,
        plan: {
          select: {
            name:          true,
            storageLimitGB: true,
            maxGalleries:  true,
          },
        },
      },
    })
  },

  /** Count non-archived galleries (draft + active count toward the limit). */
  async countActiveGalleries(photographerId: string): Promise<number> {
    return prisma.gallery.count({
      where: {
        photographerId,
        status: { not: GalleryStatus.ARCHIVED },
      },
    })
  },

  /** Atomically add bytes to storageUsedBytes — safe for concurrent uploads. */
  async incrementStorageUsed(photographerId: string, bytes: bigint): Promise<void> {
    await prisma.photographerProfile.update({
      where: { id: photographerId },
      data:  { storageUsedBytes: { increment: bytes } },
    })
  },
}
