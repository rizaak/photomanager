import { prisma } from '../../../infrastructure/database/db'

export const GalleryFolderRepository = {
  async list(photographerId: string) {
    return prisma.galleryFolder.findMany({
      where:   { photographerId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id:        true,
        name:      true,
        sortOrder: true,
        createdAt: true,
        _count:    { select: { galleries: true } },
      },
    })
  },

  async findById(id: string) {
    return prisma.galleryFolder.findUnique({
      where:  { id },
      select: { id: true, photographerId: true, name: true, sortOrder: true },
    })
  },

  async create(photographerId: string, name: string) {
    const count = await prisma.galleryFolder.count({ where: { photographerId } })
    return prisma.galleryFolder.create({
      data:   { photographerId, name: name.trim(), sortOrder: count },
      select: { id: true, name: true, sortOrder: true, createdAt: true },
    })
  },

  async update(id: string, data: { name?: string; sortOrder?: number }) {
    return prisma.galleryFolder.update({
      where:  { id },
      data,
      select: { id: true, name: true, sortOrder: true },
    })
  },

  async delete(id: string) {
    await prisma.galleryFolder.delete({ where: { id } })
  },
}
