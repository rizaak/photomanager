import { GallerySectionRepository } from '../repositories/GallerySectionRepository'
import { GalleryRepository } from '../repositories/GalleryRepository'

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

  async createSection(galleryId: string, photographerId: string, title: string) {
    await assertOwnership(galleryId, photographerId)
    const count = await GallerySectionRepository.countByGallery(galleryId)
    return GallerySectionRepository.create(galleryId, title.trim(), count)
  },

  async renameSection(sectionId: string, galleryId: string, photographerId: string, title: string) {
    const section = await GallerySectionRepository.findById(sectionId)
    if (!section || section.galleryId !== galleryId) {
      throw Object.assign(new Error('Section not found'), { status: 404 })
    }
    await assertOwnership(galleryId, photographerId)
    return GallerySectionRepository.update(sectionId, { title: title.trim() })
  },

  async deleteSection(sectionId: string, galleryId: string, photographerId: string) {
    const section = await GallerySectionRepository.findById(sectionId)
    if (!section || section.galleryId !== galleryId) {
      throw Object.assign(new Error('Section not found'), { status: 404 })
    }
    await assertOwnership(galleryId, photographerId)
    // Photos with this sectionId get sectionId = null via OnDelete: SetNull in schema
    await GallerySectionRepository.delete(sectionId)
  },
}
