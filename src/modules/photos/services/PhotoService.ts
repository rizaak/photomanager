import { EditStatus, PhotoStatus } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { storageProvider } from '@/src/infrastructure/storage/StorageProvider'
import { QueueProvider } from '@/src/infrastructure/queue/QueueProvider'
import { PhotoRepository } from '../repositories/PhotoRepository'
import { GallerySectionRepository } from '../../galleries/repositories/GallerySectionRepository'
import { UsageService } from '../../photographers/services/UsageService'
import { prisma } from '@/src/infrastructure/database/db'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

export const PhotoService = {
  async upload(
    file:           File,
    galleryId:      string,
    photographerId: string,
  ): Promise<{ photoId: string }> {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw Object.assign(
        new Error('Invalid file type. Allowed: JPG, PNG, HEIC, WEBP'),
        { status: 422 },
      )
    }
    if (file.size > MAX_BYTES) {
      throw Object.assign(new Error('File exceeds 50 MB limit'), { status: 422 })
    }

    // Enforce plan storage limit before touching R2
    await UsageService.checkStorageLimit(photographerId, file.size)

    const photoId    = uuidv4()
    const ext        = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const originalKey = `photos/originals/${photoId}.${ext}`

    await PhotoRepository.create({
      id:          photoId,
      galleryId,
      filename:    file.name,
      originalKey,
      sizeBytes:   BigInt(file.size),
      mimeType:    file.type,
    })

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      await storageProvider.upload(originalKey, buffer, file.type)
      await UsageService.incrementStorage(photographerId, file.size)
      await PhotoRepository.updateStatus(photoId, PhotoStatus.PROCESSING)
      await QueueProvider.enqueueImageProcessing(photoId, galleryId)
    } catch (err) {
      await PhotoRepository.updateStatus(photoId, PhotoStatus.FAILED)
      throw err
    }

    return { photoId }
  },

  async updateEditStatus(
    photoId:        string,
    editStatus:     EditStatus,
    photographerId: string,
  ): Promise<void> {
    const photo = await prisma.photo.findUnique({ where: { id: photoId }, select: { galleryId: true } })
    if (!photo) throw Object.assign(new Error('Photo not found'), { status: 404 })

    const gallery = await prisma.gallery.findUnique({
      where:  { id: photo.galleryId },
      select: { photographerId: true },
    })
    if (!gallery || gallery.photographerId !== photographerId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }

    await PhotoRepository.updateEditStatus(photoId, editStatus)
  },

  async assignSection(
    photoId: string,
    sectionId: string | null,
    photographerId: string,
  ): Promise<void> {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      select: { galleryId: true },
    })
    if (!photo) throw Object.assign(new Error('Photo not found'), { status: 404 })

    const gallery = await prisma.gallery.findUnique({
      where: { id: photo.galleryId },
      select: { photographerId: true },
    })
    if (!gallery || gallery.photographerId !== photographerId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }

    if (sectionId !== null) {
      const section = await GallerySectionRepository.findById(sectionId)
      if (!section || section.galleryId !== photo.galleryId) {
        throw Object.assign(new Error('Section not found'), { status: 404 })
      }
    }

    await PhotoRepository.assignSection(photoId, sectionId)
  },
}
