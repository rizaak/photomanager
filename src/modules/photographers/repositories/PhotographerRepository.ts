import { prisma } from '../../../infrastructure/database/db'

export const PhotographerRepository = {
  async findProfile(photographerId: string) {
    return prisma.photographerProfile.findUnique({
      where:  { id: photographerId },
      select: {
        id:              true,
        businessName:    true,
        storageLimitGB:  true,
        storageUsedBytes: true,
        plan: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    })
  },

  async findForUsage(photographerId: string) {
    return prisma.photographerProfile.findUnique({
      where:  { id: photographerId },
      select: {
        storageLimitGB:   true,
        storageUsedBytes: true,
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

  /** Atomically subtract bytes, floored at 0 to prevent negative values. */
  async decrementStorageUsed(photographerId: string, bytes: bigint): Promise<void> {
    await prisma.$executeRaw`
      UPDATE "PhotographerProfile"
      SET "storageUsedBytes" = GREATEST(0, "storageUsedBytes" - ${bytes})
      WHERE id = ${photographerId}
    `
  },
}
