import { prisma } from '@/src/infrastructure/database/db'

export const GallerySectionRepository = {
  async findAll(galleryId: string) {
    return prisma.gallerySection.findMany({
      where: { galleryId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, title: true, sortOrder: true, visibleToClient: true, watermarkEnabled: true },
    })
  },

  async findById(id: string) {
    return prisma.gallerySection.findUnique({
      where: { id },
      select: { id: true, galleryId: true, title: true, sortOrder: true, visibleToClient: true, watermarkEnabled: true },
    })
  },

  async countByGallery(galleryId: string) {
    return prisma.gallerySection.count({ where: { galleryId } })
  },

  async findByTitleForGallery(galleryId: string, title: string) {
    return prisma.gallerySection.findFirst({
      where:  { galleryId, title: { equals: title, mode: 'insensitive' } },
      select: { id: true, title: true },
    })
  },

  async create(galleryId: string, title: string, sortOrder: number, visibleToClient?: boolean, watermarkEnabled?: boolean) {
    return prisma.gallerySection.create({
      data: {
        galleryId, title, sortOrder,
        ...(visibleToClient !== undefined && { visibleToClient }),
        ...(watermarkEnabled !== undefined && { watermarkEnabled }),
      },
      select: { id: true, title: true, sortOrder: true, visibleToClient: true, watermarkEnabled: true },
    })
  },

  async update(id: string, data: { title?: string; sortOrder?: number; visibleToClient?: boolean; watermarkEnabled?: boolean }) {
    return prisma.gallerySection.update({
      where: { id },
      data,
      select: { id: true, title: true, sortOrder: true, visibleToClient: true, watermarkEnabled: true },
    })
  },

  async findStorageKeysForSection(sectionId: string): Promise<string[]> {
    const photos = await prisma.photo.findMany({
      where:  { sectionId },
      select: { originalKey: true, previewKey: true, thumbnailKey: true, watermarkedKey: true, finalKey: true },
    })
    const keys: string[] = []
    for (const p of photos) {
      keys.push(p.originalKey)
      if (p.previewKey)     keys.push(p.previewKey)
      if (p.thumbnailKey)   keys.push(p.thumbnailKey)
      if (p.watermarkedKey) keys.push(p.watermarkedKey)
      if (p.finalKey)       keys.push(p.finalKey)
    }
    return keys
  },

  async deletePhotos(sectionId: string): Promise<void> {
    await prisma.photo.deleteMany({ where: { sectionId } })
  },

  async delete(id: string) {
    await prisma.gallerySection.delete({ where: { id } })
  },
}
