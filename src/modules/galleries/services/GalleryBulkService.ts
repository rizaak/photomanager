import { GalleryStatus, DownloadType } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'
import { GalleryFolderRepository } from '../repositories/GalleryFolderRepository'

const VALID_STATUSES = new Set<GalleryStatus>(['DRAFT', 'ACTIVE', 'ARCHIVED'])

export type BulkAction =
  | { type: 'moveToFolder';  folderId: string | null }
  | { type: 'updateStatus';  status: string }
  | { type: 'applyPreset';   presetId: string }
  | { type: 'updateExpiry';  expiresAt: string | null }
  | { type: 'toggleDownload'; downloadEnabled: boolean }
  | { type: 'toggleRegistration'; requireClientInfo: boolean }
  | { type: 'delete' }

export const GalleryBulkService = {
  async apply(photographerId: string, galleryIds: string[], action: BulkAction) {
    if (!galleryIds.length) throw Object.assign(new Error('No galleries selected'), { status: 400 })
    if (galleryIds.length > 200) throw Object.assign(new Error('Too many galleries'), { status: 400 })

    // Verify all galleries belong to photographer
    const count = await prisma.gallery.count({
      where: { id: { in: galleryIds }, photographerId },
    })
    if (count !== galleryIds.length) throw Object.assign(new Error('Forbidden'), { status: 403 })

    switch (action.type) {
      case 'moveToFolder': {
        if (action.folderId !== null) {
          const folder = await GalleryFolderRepository.findById(action.folderId)
          if (!folder || folder.photographerId !== photographerId)
            throw Object.assign(new Error('Folder not found'), { status: 404 })
        }
        await prisma.gallery.updateMany({
          where: { id: { in: galleryIds } },
          data:  { folderId: action.folderId },
        })
        return { updated: galleryIds.length }
      }

      case 'updateStatus': {
        const status = action.status.toUpperCase() as GalleryStatus
        if (!VALID_STATUSES.has(status))
          throw Object.assign(new Error('Invalid status'), { status: 400 })
        await prisma.gallery.updateMany({
          where: { id: { in: galleryIds } },
          data:  { status },
        })
        return { updated: galleryIds.length }
      }

      case 'applyPreset': {
        const preset = await prisma.galleryPreset.findFirst({
          where: { id: action.presetId, photographerId },
        })
        if (!preset) throw Object.assign(new Error('Preset not found'), { status: 404 })
        const expiresInDays = preset.expiresInDays
        const expiresAt = expiresInDays
          ? new Date(Date.now() + expiresInDays * 86_400_000)
          : null

        await prisma.gallery.updateMany({
          where: { id: { in: galleryIds } },
          data: {
            allowSelection:    preset.allowSelection,
            allowFavorites:    preset.allowFavorites,
            allowComments:     preset.allowComments,
            requireClientInfo: preset.requireClientInfo,
            downloadEnabled:   preset.downloadEnabled,
            downloadType:      preset.downloadType as DownloadType,
            watermarkEnabled:  preset.watermarkEnabled,
            ...(expiresAt ? { expiresAt } : {}),
          },
        })
        return { updated: galleryIds.length }
      }

      case 'updateExpiry': {
        const expiresAt = action.expiresAt ? new Date(action.expiresAt) : null
        if (action.expiresAt && isNaN(expiresAt!.getTime()))
          throw Object.assign(new Error('Invalid date'), { status: 400 })
        await prisma.gallery.updateMany({
          where: { id: { in: galleryIds } },
          data:  { expiresAt },
        })
        return { updated: galleryIds.length }
      }

      case 'toggleDownload': {
        await prisma.gallery.updateMany({
          where: { id: { in: galleryIds } },
          data:  { downloadEnabled: action.downloadEnabled },
        })
        return { updated: galleryIds.length }
      }

      case 'toggleRegistration': {
        await prisma.gallery.updateMany({
          where: { id: { in: galleryIds } },
          data:  { requireClientInfo: action.requireClientInfo },
        })
        return { updated: galleryIds.length }
      }

      case 'delete': {
        await prisma.gallery.deleteMany({
          where: { id: { in: galleryIds }, photographerId },
        })
        return { deleted: galleryIds.length }
      }

      default:
        throw Object.assign(new Error('Unknown action'), { status: 400 })
    }
  },
}
