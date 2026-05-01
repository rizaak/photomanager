import { EditStatus, PhotoStatus } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { storageProvider } from '@/src/infrastructure/storage/StorageProvider'
import { QueueProvider } from '@/src/infrastructure/queue/QueueProvider'
import { PhotoRepository } from '../repositories/PhotoRepository'
import { GallerySectionRepository } from '../../galleries/repositories/GallerySectionRepository'
import { UsageService } from '../../photographers/services/UsageService'
import { ActivityService } from '../../activity/services/ActivityService'
import { WatermarkRepository } from '../../watermarks/repositories/WatermarkRepository'
import { prisma } from '@/src/infrastructure/database/db'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

// ── Helpers ─────────────────────────────────────────────────────────────────

async function assertPhotoOwnership(photoId: string, photographerId: string) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId }, select: { galleryId: true } })
  if (!photo) throw Object.assign(new Error('Photo not found'), { status: 404 })

  const gallery = await prisma.gallery.findUnique({
    where:  { id: photo.galleryId },
    select: { photographerId: true },
  })
  if (!gallery || gallery.photographerId !== photographerId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  return photo
}

async function bulkAssertOwnership(photoIds: string[], photographerId: string): Promise<string[]> {
  const photos = await prisma.photo.findMany({
    where:  { id: { in: photoIds } },
    select: { id: true, galleryId: true },
  })
  if (photos.length === 0) throw Object.assign(new Error('No photos found'), { status: 404 })

  const galleryIds = [...new Set(photos.map((p) => p.galleryId))]
  const galleries  = await prisma.gallery.findMany({
    where:  { id: { in: galleryIds } },
    select: { id: true, photographerId: true },
  })
  const ownedGalleryIds = new Set(
    galleries.filter((g) => g.photographerId === photographerId).map((g) => g.id),
  )
  const validIds = photos.filter((p) => ownedGalleryIds.has(p.galleryId)).map((p) => p.id)
  if (validIds.length === 0) throw Object.assign(new Error('Forbidden'), { status: 403 })
  return validIds
}

async function deletePhotoById(photoId: string, photographerId: string): Promise<void> {
  const ref = await prisma.photo.findUnique({
    where:  { id: photoId },
    select: {
      galleryId:      true,
      sizeBytes:      true,
      originalKey:    true,
      thumbnailKey:   true,
      previewKey:     true,
      watermarkedKey: true,
      finalKey:       true,
    },
  })
  if (!ref) return // already gone

  const gallery = await prisma.gallery.findUnique({
    where:  { id: ref.galleryId },
    select: { photographerId: true },
  })
  if (!gallery || gallery.photographerId !== photographerId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }

  await PhotoRepository.deletePhoto(photoId)

  const keys = [ref.originalKey, ref.thumbnailKey, ref.previewKey, ref.watermarkedKey, ref.finalKey]
    .filter(Boolean) as string[]
  await Promise.allSettled(keys.map((k) => storageProvider.delete(k)))

  await UsageService.decrementStorage(photographerId, Number(ref.sizeBytes))
}

function cleanLabels(labels: string[]): string[] {
  return [...new Set(
    labels
      .filter((l): l is string => typeof l === 'string')
      .map((l) => l.trim().toLowerCase().replace(/[^a-z0-9-_]/g, ''))
      .filter((l) => l.length > 0 && l.length <= 30),
  )]
}

// ── PhotoService ─────────────────────────────────────────────────────────────

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

    await UsageService.checkStorageLimit(photographerId, file.size)

    const photoId     = uuidv4()
    const ext         = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
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
    await assertPhotoOwnership(photoId, photographerId)
    await PhotoRepository.updateEditStatus(photoId, editStatus)
  },

  async uploadFinal(
    photoId:        string,
    file:           File,
    photographerId: string,
  ): Promise<{ finalUrl: string }> {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw Object.assign(new Error('Invalid file type. Allowed: JPG, PNG, HEIC, WEBP'), { status: 422 })
    }
    if (file.size > MAX_BYTES) {
      throw Object.assign(new Error('File exceeds 50 MB limit'), { status: 422 })
    }

    const photo = await assertPhotoOwnership(photoId, photographerId)

    const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const finalKey = `photos/finals/${photoId}.${ext}`
    const buffer   = Buffer.from(await file.arrayBuffer())

    await storageProvider.upload(finalKey, buffer, file.type)
    await PhotoRepository.updateFinalKey(photoId, finalKey)

    ActivityService.log(photo.galleryId, 'FINAL_UPLOADED', { photoId })

    const finalUrl = await storageProvider.getSignedUrl(finalKey, 3600)
    return { finalUrl }
  },

  async assignSection(
    photoId:        string,
    sectionId:      string | null,
    photographerId: string,
  ): Promise<void> {
    const photo = await assertPhotoOwnership(photoId, photographerId)

    if (sectionId !== null) {
      const section = await GallerySectionRepository.findById(sectionId)
      if (!section || section.galleryId !== photo.galleryId) {
        throw Object.assign(new Error('Section not found'), { status: 404 })
      }
    }

    await PhotoRepository.assignSection(photoId, sectionId)
  },

  // ── New management actions ─────────────────────────────────────────────────

  async applyWatermark(
    photoId:        string,
    photographerId: string,
    presetId:       string | null | undefined,
    remove:         boolean,
  ): Promise<void> {
    await assertPhotoOwnership(photoId, photographerId)

    if (!remove && presetId) {
      const preset = await WatermarkRepository.findById(presetId)
      if (!preset || preset.photographerId !== photographerId) {
        throw Object.assign(new Error('Watermark preset not found'), { status: 404 })
      }
    }

    await PhotoRepository.setAppliedWatermarkPreset(photoId, remove ? null : (presetId ?? null))
    await QueueProvider.enqueueWatermarkRegeneration(photoId, remove ? null : (presetId ?? undefined))
  },

  async deletePhoto(photoId: string, photographerId: string): Promise<void> {
    await deletePhotoById(photoId, photographerId)
  },

  async updateLabels(
    photoId:        string,
    photographerId: string,
    labels:         string[],
  ): Promise<void> {
    await assertPhotoOwnership(photoId, photographerId)
    await PhotoRepository.updateLabels(photoId, cleanLabels(labels))
  },

  // ── Bulk operations ────────────────────────────────────────────────────────

  async bulkMoveToSection(
    photoIds:       string[],
    photographerId: string,
    sectionId:      string | null,
  ): Promise<void> {
    const validIds = await bulkAssertOwnership(photoIds, photographerId)
    if (sectionId) {
      const section = await GallerySectionRepository.findById(sectionId)
      if (!section) throw Object.assign(new Error('Section not found'), { status: 404 })
      const sample = await prisma.photo.findFirst({ where: { id: { in: validIds } }, select: { galleryId: true } })
      if (sample && section.galleryId !== sample.galleryId) {
        throw Object.assign(new Error('Section not found'), { status: 404 })
      }
    }
    await PhotoRepository.bulkAssignSection(validIds, sectionId)
  },

  async bulkUpdateLabels(
    photoIds:       string[],
    photographerId: string,
    addLabels:      string[],
    removeLabels:   string[],
  ): Promise<void> {
    const validIds = await bulkAssertOwnership(photoIds, photographerId)
    if (addLabels.length > 0)    await PhotoRepository.bulkAddLabels(validIds, cleanLabels(addLabels))
    if (removeLabels.length > 0) await PhotoRepository.bulkRemoveLabels(validIds, cleanLabels(removeLabels))
  },

  async bulkApplyWatermark(
    photoIds:       string[],
    photographerId: string,
    presetId:       string | null | undefined,
    remove:         boolean,
  ): Promise<void> {
    const validIds = await bulkAssertOwnership(photoIds, photographerId)

    if (!remove && presetId) {
      const preset = await WatermarkRepository.findById(presetId)
      if (!preset || preset.photographerId !== photographerId) {
        throw Object.assign(new Error('Watermark preset not found'), { status: 404 })
      }
    }

    const effectivePreset = remove ? null : (presetId ?? undefined)
    await PhotoRepository.bulkSetAppliedWatermarkPreset(validIds, effectivePreset ?? null)
    await Promise.all(validIds.map((id) => QueueProvider.enqueueWatermarkRegeneration(id, effectivePreset ?? undefined)))
  },

  async bulkEditStatus(
    photoIds:       string[],
    photographerId: string,
    editStatus:     EditStatus,
  ): Promise<void> {
    const validIds = await bulkAssertOwnership(photoIds, photographerId)
    await PhotoRepository.bulkUpdateEditStatus(validIds, editStatus)
  },

  async bulkDelete(photoIds: string[], photographerId: string): Promise<void> {
    const validIds = await bulkAssertOwnership(photoIds, photographerId)
    await Promise.allSettled(validIds.map((id) => deletePhotoById(id, photographerId)))
  },
}
