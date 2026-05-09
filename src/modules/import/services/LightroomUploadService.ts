import { PhotoSource, PhotoStatus } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { storageProvider } from '@/src/infrastructure/storage/StorageProvider'
import { QueueProvider } from '@/src/infrastructure/queue/QueueProvider'
import { PhotoRepository } from '../../photos/repositories/PhotoRepository'
import { UsageService } from '../../photographers/services/UsageService'
import { ImportKeyRepository } from '../repositories/ImportKeyRepository'
import { GalleryRepository } from '../../galleries/repositories/GalleryRepository'
import { GalleryService } from '../../galleries/services/GalleryService'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
  'image/tiff',
])
const MAX_BYTES = 200 * 1024 * 1024 // 200 MB — Lightroom exports can be large

// TODO: implement per-key rate limiting (e.g. 100 uploads/hour via Redis sliding window)

export const LightroomUploadService = {
  async upload(opts: {
    apiKeyPlaintext:  string
    fileBuffer:       Buffer
    mimeType:         string
    filename:         string
    originalFilename: string
    fileSize:         number
    galleryId?:       string   // explicit target gallery
    galleryName?:     string   // find-or-create by name
  }) {
    // ── 1. Authenticate API key ───────────────────────────────────────────────
    const keyHash   = ImportKeyRepository.hashKey(opts.apiKeyPlaintext)
    const keyRecord = await ImportKeyRepository.findByHash(keyHash)

    if (!keyRecord || !keyRecord.active) {
      throw Object.assign(new Error('Invalid or revoked API key'), { status: 401 })
    }

    const { id: keyId, photographerId, defaultGalleryId } = keyRecord

    // ── 2. Resolve gallery ────────────────────────────────────────────────────
    let resolvedGalleryId: string

    if (opts.galleryId) {
      // Explicit gallery — verify ownership
      const gallery = await GalleryService.getDetail(opts.galleryId, photographerId)
      if (!gallery) {
        throw Object.assign(new Error('Gallery not found or access denied'), { status: 404 })
      }
      resolvedGalleryId = opts.galleryId
    } else if (opts.galleryName?.trim()) {
      // Find-or-create gallery by name (case-insensitive)
      const name  = opts.galleryName.trim()
      const match = await GalleryRepository.findByTitleForPhotographer(name, photographerId)
      if (match) {
        resolvedGalleryId = match.id
      } else {
        const created = await GalleryRepository.create(photographerId, { title: name, clientName: '' })
        resolvedGalleryId = created.id
      }
    } else if (defaultGalleryId) {
      // Fall back to key's default gallery
      resolvedGalleryId = defaultGalleryId
    } else {
      // Auto-create or reuse a dated gallery — no gallery context required from Lightroom
      const today = new Date().toISOString().slice(0, 10)
      const autoName = `Lightroom Import — ${today}`
      const existing = await GalleryRepository.findByTitleForPhotographer(autoName, photographerId)
      if (existing) {
        resolvedGalleryId = existing.id
      } else {
        const created = await GalleryRepository.create(photographerId, { title: autoName, clientName: '' })
        resolvedGalleryId = created.id
      }
    }

    // ── 3. Validate file ──────────────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.has(opts.mimeType)) {
      throw Object.assign(
        new Error('Unsupported file type. Allowed: JPEG, PNG, HEIC, WEBP, TIFF'),
        { status: 422 },
      )
    }
    if (opts.fileSize > MAX_BYTES) {
      throw Object.assign(new Error('File exceeds 200 MB limit'), { status: 422 })
    }
    if (!opts.filename.trim()) {
      throw Object.assign(new Error('filename is required'), { status: 400 })
    }

    // ── 4. Check storage quota ────────────────────────────────────────────────
    await UsageService.checkStorageLimit(photographerId, opts.fileSize)

    // ── 5. Persist Photo record ───────────────────────────────────────────────
    const photoId     = uuidv4()
    const ext         = opts.filename.split('.').pop()?.toLowerCase() ?? 'jpg'
    const originalKey = `photos/originals/${photoId}.${ext}`

    await PhotoRepository.create({
      id:               photoId,
      galleryId:        resolvedGalleryId,
      filename:         opts.filename.trim(),
      originalFilename: opts.originalFilename.trim() || undefined,
      source:           PhotoSource.LIGHTROOM,
      originalKey,
      sizeBytes:        BigInt(opts.fileSize),
      mimeType:         opts.mimeType,
    })

    // ── 6. Upload to R2 + enqueue processing ─────────────────────────────────
    try {
      await storageProvider.upload(originalKey, opts.fileBuffer, opts.mimeType)
      await UsageService.incrementStorage(photographerId, opts.fileSize)
      await PhotoRepository.updateStatus(photoId, PhotoStatus.PROCESSING)
      await QueueProvider.enqueueImageProcessing(photoId, resolvedGalleryId)
    } catch (err) {
      await PhotoRepository.updateStatus(photoId, PhotoStatus.FAILED)
      throw err
    }

    // ── 7. Touch lastUsedAt (fire-and-forget) ─────────────────────────────────
    ImportKeyRepository.touchLastUsed(keyId).catch(() => {})

    // ── 8. Build response URL ─────────────────────────────────────────────────
    const base = (process.env.APP_BASE_URL ?? '').replace(/\/$/, '')
    const url  = `${base}/dashboard/galleries/${resolvedGalleryId}`

    return { id: photoId, galleryId: resolvedGalleryId, url }
  },
}
