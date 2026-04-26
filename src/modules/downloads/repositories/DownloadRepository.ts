import { DownloadStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'

export const DownloadRepository = {
  async create(galleryId: string, selectionId: string) {
    return prisma.download.create({
      data: { galleryId, selectionId },
    })
  },

  async findById(id: string) {
    return prisma.download.findUnique({ where: { id } })
  },

  async updateStatus(id: string, status: DownloadStatus): Promise<void> {
    await prisma.download.update({ where: { id }, data: { status } })
  },

  async updateReady(id: string, zipKey: string): Promise<void> {
    await prisma.download.update({
      where: { id },
      data: { status: DownloadStatus.READY, zipKey },
    })
  },
}
