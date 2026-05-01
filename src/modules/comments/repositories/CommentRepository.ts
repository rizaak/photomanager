import { prisma } from '../../../infrastructure/database/db'

const CLIENT_COMMENT_SELECT = {
  id:        true,
  body:      true,
  photoId:   true,
  createdAt: true,
  updatedAt: true,
  galleryClient: { select: { name: true } },
} as const

export const CommentRepository = {
  async create(galleryClientId: string, galleryId: string, body: string, photoId?: string) {
    return prisma.comment.create({
      data:   { galleryClientId, galleryId, body, photoId: photoId ?? null },
      select: CLIENT_COMMENT_SELECT,
    })
  },

  async findOne(id: string) {
    return prisma.comment.findUnique({
      where:  { id },
      select: { id: true, galleryClientId: true, galleryId: true, body: true, photoId: true },
    })
  },

  /** All comments the client has written on specific photos in a gallery. */
  async findByClient(galleryClientId: string, galleryId: string) {
    return prisma.comment.findMany({
      where:   { galleryClientId, galleryId, photoId: { not: null } },
      orderBy: { createdAt: 'asc' },
      select:  { id: true, body: true, photoId: true, updatedAt: true },
    })
  },

  async update(id: string, body: string) {
    return prisma.comment.update({
      where:  { id },
      data:   { body },
      select: CLIENT_COMMENT_SELECT,
    })
  },

  async delete(id: string) {
    await prisma.comment.delete({ where: { id } })
  },

  async findByGallery(galleryId: string) {
    return prisma.comment.findMany({
      where:   { galleryId },
      orderBy: { createdAt: 'asc' },
      select: {
        id:        true,
        body:      true,
        photoId:   true,
        createdAt: true,
        updatedAt: true,
        galleryClient: { select: { name: true, email: true } },
      },
    })
  },
}
