import { prisma } from '@/src/infrastructure/database/db'

export const GallerySectionRepository = {
  async findAll(galleryId: string) {
    return prisma.gallerySection.findMany({
      where: { galleryId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, title: true, sortOrder: true, visibleToClient: true },
    })
  },

  async findById(id: string) {
    return prisma.gallerySection.findUnique({
      where: { id },
      select: { id: true, galleryId: true, title: true, sortOrder: true, visibleToClient: true },
    })
  },

  async countByGallery(galleryId: string) {
    return prisma.gallerySection.count({ where: { galleryId } })
  },

  async create(galleryId: string, title: string, sortOrder: number, visibleToClient?: boolean) {
    return prisma.gallerySection.create({
      data: { galleryId, title, sortOrder, ...(visibleToClient !== undefined && { visibleToClient }) },
      select: { id: true, title: true, sortOrder: true, visibleToClient: true },
    })
  },

  async update(id: string, data: { title?: string; sortOrder?: number; visibleToClient?: boolean }) {
    return prisma.gallerySection.update({
      where: { id },
      data,
      select: { id: true, title: true, sortOrder: true, visibleToClient: true },
    })
  },

  async delete(id: string) {
    await prisma.gallerySection.delete({ where: { id } })
  },
}
