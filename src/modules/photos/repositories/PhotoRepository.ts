import { EditStatus, PhotoStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'

export interface CreatePhotoInput {
  id: string
  galleryId: string
  filename: string
  originalKey: string
  sizeBytes: bigint
  mimeType: string
}

export interface UpdateProcessedInput {
  thumbnailKey: string
  previewKey: string
  watermarkedKey: string
  width: number
  height: number
  status: PhotoStatus
}

export const PhotoRepository = {
  async create(input: CreatePhotoInput): Promise<void> {
    await prisma.photo.create({
      data: {
        id: input.id,
        galleryId: input.galleryId,
        filename: input.filename,
        originalKey: input.originalKey,
        sizeBytes: input.sizeBytes,
        mimeType: input.mimeType,
        status: PhotoStatus.UPLOADING,
      },
    })
  },

  async findById(id: string) {
    return prisma.photo.findUnique({ where: { id } })
  },

  async updateStatus(id: string, status: PhotoStatus): Promise<void> {
    await prisma.photo.update({ where: { id }, data: { status } })
  },

  async findGalleryWithReadyPhotos(galleryId: string) {
    const PHOTO_SELECT = {
      id: true,
      galleryId: true,
      filename: true,
      width: true,
      height: true,
      thumbnailKey: true,
      watermarkedKey: true,
    } as const

    const READY_WHERE = {
      status: PhotoStatus.READY,
      thumbnailKey: { not: null as null },
      watermarkedKey: { not: null as null },
    }

    return prisma.gallery.findUnique({
      where: { id: galleryId },
      select: {
        id: true,
        title: true,
        sections: {
          orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
          select: {
            id: true,
            title: true,
            sortOrder: true,
            photos: {
              where: READY_WHERE,
              orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
              select: PHOTO_SELECT,
            },
          },
        },
        photos: {
          where: { ...READY_WHERE, sectionId: null },
          orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
          select: PHOTO_SELECT,
        },
      },
    })
  },

  async findNonReadyByGallery(galleryId: string) {
    return prisma.photo.findMany({
      where: {
        galleryId,
        status: { notIn: [PhotoStatus.READY] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, galleryId: true, filename: true, status: true, sectionId: true },
    })
  },

  async findManyByIds(ids: string[]) {
    return prisma.photo.findMany({
      where: { id: { in: ids }, status: PhotoStatus.READY },
      select: { id: true, filename: true, originalKey: true },
    })
  },

  async updateEditStatus(id: string, editStatus: EditStatus): Promise<void> {
    await prisma.photo.update({ where: { id }, data: { editStatus } })
  },

  async updateFinalKey(id: string, finalKey: string): Promise<void> {
    await prisma.photo.update({
      where: { id },
      data:  { finalKey, editStatus: EditStatus.FINAL_READY },
    })
  },

  async assignSection(id: string, sectionId: string | null): Promise<void> {
    await prisma.photo.update({ where: { id }, data: { sectionId } })
  },

  async updateProcessed(id: string, input: UpdateProcessedInput): Promise<void> {
    await prisma.photo.update({
      where: { id },
      data: {
        thumbnailKey:   input.thumbnailKey,
        previewKey:     input.previewKey,
        watermarkedKey: input.watermarkedKey,
        width:          input.width,
        height:         input.height,
        status:         input.status,
      },
    })
  },
}
