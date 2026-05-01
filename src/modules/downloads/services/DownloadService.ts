import { DownloadStatus, PhotoStatus } from '@prisma/client'
import { PhotoRepository } from '../../photos/repositories/PhotoRepository'
import { SelectionRepository } from '../../selections/repositories/SelectionRepository'
import { DownloadRepository } from '../repositories/DownloadRepository'
import { GalleryRepository } from '../../galleries/repositories/GalleryRepository'
import { ClientRepository } from '../../clients/repositories/ClientRepository'
import { QueueProvider } from '../../../infrastructure/queue/QueueProvider'
import { storageProvider } from '../../../infrastructure/storage/StorageProvider'

const ANON_EMAIL = 'anonymous@gallery.local'

async function resolveClientEmail(clientToken?: string): Promise<string> {
  if (!clientToken) return ANON_EMAIL
  const client = await ClientRepository.findByToken(clientToken)
  return client?.email ?? ANON_EMAIL
}

// 5-minute expiry for single-photo downloads
const PHOTO_DOWNLOAD_EXPIRY_S = 300
// 1-hour expiry for ZIP downloads (larger file — give the browser time to stream it)
const ZIP_DOWNLOAD_EXPIRY_S = 3600

export const DownloadService = {
  // ── Single photo (photographer only — returns signed URL for original) ────
  async getDownloadUrl(photoId: string, photographerId: string): Promise<{ url: string }> {
    const photo = await PhotoRepository.findById(photoId)

    if (!photo) {
      throw Object.assign(new Error('Photo not found'), { status: 404 })
    }

    // Verify the photo belongs to a gallery owned by this photographer
    const gallery = await GalleryRepository.findPermissionsWithOwner(photo.galleryId)
    if (!gallery || gallery.photographerId !== photographerId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }

    if (photo.status !== PhotoStatus.READY || !photo.originalKey) {
      throw Object.assign(new Error('Photo is not ready'), { status: 409 })
    }

    const url = await storageProvider.getSignedUrl(
      photo.originalKey,
      PHOTO_DOWNLOAD_EXPIRY_S,
      photo.filename,
    )
    return { url }
  },

  // ── ZIP — request ─────────────────────────────────────────────────────────
  async requestZip(galleryId: string, clientToken?: string): Promise<{ downloadId: string }> {
    const perms = await GalleryRepository.findPermissions(galleryId)
    if (!perms) {
      throw Object.assign(new Error('Gallery not found'), { status: 404 })
    }
    if (!perms.downloadEnabled) {
      throw Object.assign(new Error('Downloads are not enabled for this gallery'), { status: 403 })
    }

    const clientEmail = await resolveClientEmail(clientToken)
    // Find or create the client's selection for this gallery
    const selection = await SelectionRepository.findOrCreate(galleryId, clientEmail)
    const photoIds  = await SelectionRepository.getPhotoIds(selection.id)

    if (photoIds.length === 0) {
      throw Object.assign(new Error('No photos selected'), { status: 422 })
    }

    // Validate at least one photo is READY (quick pre-check)
    const photos = await PhotoRepository.findManyByIds(photoIds)
    if (photos.length === 0) {
      throw Object.assign(new Error('No ready photos in selection'), { status: 422 })
    }

    const download = await DownloadRepository.create(galleryId, selection.id)
    await QueueProvider.enqueueZipGeneration(download.id, selection.id)

    return { downloadId: download.id }
  },

  // ── ZIP — poll status ─────────────────────────────────────────────────────
  async getZipStatus(
    downloadId: string,
  ): Promise<{ status: DownloadStatus; url?: string }> {
    const download = await DownloadRepository.findById(downloadId)

    if (!download) {
      throw Object.assign(new Error('Download not found'), { status: 404 })
    }

    if (download.status === DownloadStatus.READY && download.zipKey) {
      const url = await storageProvider.getSignedUrl(
        download.zipKey,
        ZIP_DOWNLOAD_EXPIRY_S,
        'selection.zip',
      )
      return { status: DownloadStatus.READY, url }
    }

    return { status: download.status }
  },
}
