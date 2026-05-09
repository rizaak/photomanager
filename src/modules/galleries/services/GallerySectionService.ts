import { GallerySectionRepository } from '../repositories/GallerySectionRepository'
import { GalleryRepository } from '../repositories/GalleryRepository'
import { storageProvider } from '../../../infrastructure/storage/StorageProvider'

function ownershipError() {
  return Object.assign(new Error('Gallery not found'), { status: 404 })
}

async function assertOwnership(galleryId: string, photographerId: string) {
  const gallery = await GalleryRepository.findDetail(galleryId)
  if (!gallery || gallery.photographerId !== photographerId) throw ownershipError()
}

export const GallerySectionService = {
  /** For page.tsx — caller has already verified ownership */
  async listForGallery(galleryId: string) {
    return GallerySectionRepository.findAll(galleryId)
  },

  /** For API endpoints — includes ownership check */
  async listSections(galleryId: string, photographerId: string) {
    await assertOwnership(galleryId, photographerId)
    return GallerySectionRepository.findAll(galleryId)
  },

  async createSection(galleryId: string, photographerId: string, title: string, visibleToClient?: boolean) {
    await assertOwnership(galleryId, photographerId)
    const count = await GallerySectionRepository.countByGallery(galleryId)
    return GallerySectionRepository.create(galleryId, title.trim(), count, visibleToClient)
  },

  async updateSection(
    sectionId: string,
    galleryId: string,
    photographerId: string,
    data: { title?: string; visibleToClient?: boolean },
  ) {
    const section = await GallerySectionRepository.findById(sectionId)
    if (!section || section.galleryId !== galleryId) {
      throw Object.assign(new Error('Section not found'), { status: 404 })
    }
    await assertOwnership(galleryId, photographerId)
    return GallerySectionRepository.update(sectionId, data)
  },

  async deleteSection(
    sectionId: string,
    galleryId: string,
    photographerId: string,
    mode: 'keep_photos' | 'delete_photos' = 'keep_photos',
  ) {
    const section = await GallerySectionRepository.findById(sectionId)
    if (!section || section.galleryId !== galleryId) {
      throw Object.assign(new Error('Section not found'), { status: 404 })
    }
    await assertOwnership(galleryId, photographerId)

    if (mode === 'delete_photos') {
      // Collect R2 keys before touching DB
      const storageKeys = await GallerySectionRepository.findStorageKeysForSection(sectionId)
      // Delete photos first (schema uses SetNull, not Cascade)
      await GallerySectionRepository.deletePhotos(sectionId)
      await GallerySectionRepository.delete(sectionId)
      // Delete R2 objects — log failures, don't re-throw
      const failed: string[] = []
      await Promise.all(
        storageKeys.map(async (key) => {
          try { await storageProvider.delete(key) }
          catch (err) {
            console.error(`[section-delete] R2 delete failed: ${key}`, err)
            failed.push(key)
          }
        }),
      )
      if (failed.length > 0) {
        console.warn(`[section-delete] ${failed.length} R2 key(s) not deleted for section ${sectionId}`)
      }
    } else {
      // Keep photos — schema SetNull moves them to unsectioned
      await GallerySectionRepository.delete(sectionId)
    }
  },
}
