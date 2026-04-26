import { prisma } from '../../../infrastructure/database/db'

export const ClientRepository = {
  /** Find existing client, or register a new one. Token is preserved for returning clients. */
  async findOrCreate(galleryId: string, email: string, name: string) {
    const existing = await prisma.galleryClient.findUnique({
      where: { galleryId_email: { galleryId, email } },
    })
    if (existing) return existing

    return prisma.galleryClient.create({
      data: { galleryId, email, name },
    })
  },

  /** Resolve a client by their access token. Returns null if token is invalid. */
  async findByToken(accessToken: string) {
    return prisma.galleryClient.findUnique({
      where:  { accessToken },
      select: { id: true, galleryId: true, email: true, name: true },
    })
  },

  /** List all clients for a gallery with their selection snapshot. */
  async findByGallery(galleryId: string) {
    return prisma.galleryClient.findMany({
      where:   { galleryId },
      orderBy: { createdAt: 'asc' },
      select: {
        id:          true,
        name:        true,
        email:       true,
        createdAt:   true,
        selections: {
          where:   { galleryId },
          orderBy: { createdAt: 'desc' },
          take:    1,
          select: {
            submittedAt: true,
            _count:      { select: { items: true } },
          },
        },
      },
    })
  },
}
