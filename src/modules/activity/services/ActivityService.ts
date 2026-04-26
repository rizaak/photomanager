import { GalleryEventType } from '@prisma/client'
import { ActivityRepository } from '../repositories/ActivityRepository'

export const ActivityService = {
  /** Fire-and-forget: log an event without blocking the caller */
  log(galleryId: string, eventType: GalleryEventType, metadata?: Record<string, unknown>) {
    ActivityRepository.log(galleryId, eventType, metadata).catch((err) => {
      console.error('[ActivityService.log]', err)
    })
  },

  async getForGallery(galleryId: string, photographerId: string) {
    const { GalleryRepository } = await import('../../galleries/repositories/GalleryRepository')
    const gallery = await GalleryRepository.findDetail(galleryId)
    if (!gallery) throw Object.assign(new Error('Not found'), { status: 404 })
    if (gallery.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })

    const events = await ActivityRepository.findByGallery(galleryId)
    return events.map((e) => ({
      id:        e.id,
      eventType: e.eventType,
      metadata:  e.metadata,
      createdAt: e.createdAt.toISOString(),
    }))
  },
}
