import { ClientActivity } from '@prisma/client'
import { SelectionRepository } from '../repositories/SelectionRepository'
import { GalleryRepository } from '../../galleries/repositories/GalleryRepository'
import { ClientRepository } from '../../clients/repositories/ClientRepository'
import { QueueProvider } from '../../../infrastructure/queue/QueueProvider'
import { ActivityService } from '../../activity/services/ActivityService'

// Fallback identity used for galleries that don't require client registration
const ANON_EMAIL = 'anonymous@gallery.local'

async function assertSelectionAllowed(galleryId: string) {
  const perms = await GalleryRepository.findPermissions(galleryId)
  if (!perms) throw Object.assign(new Error('Gallery not found'), { status: 404 })
  if (!perms.allowSelection) {
    throw Object.assign(new Error('Selection is not enabled for this gallery'), { status: 403 })
  }
}

/** Resolve client identity from an access token. Falls back to anonymous. */
async function resolveClient(clientToken?: string) {
  if (!clientToken) return { email: ANON_EMAIL, name: undefined, id: undefined }
  const client = await ClientRepository.findByToken(clientToken)
  if (!client)    return { email: ANON_EMAIL, name: undefined, id: undefined }
  return { email: client.email, name: client.name, id: client.id }
}

export const SelectionService = {
  async getForGallery(galleryId: string, clientToken?: string) {
    const client    = await resolveClient(clientToken)
    const selection = await SelectionRepository.findOrCreate(galleryId, client.email, client.name, client.id)
    const photoIds  = await SelectionRepository.getPhotoIds(selection.id)
    return {
      selectionId:  selection.id,
      photoIds,
      submittedAt:  selection.submittedAt?.toISOString() ?? null,
    }
  },

  async togglePhoto(galleryId: string, photoId: string, clientToken?: string) {
    await assertSelectionAllowed(galleryId)

    const client    = await resolveClient(clientToken)
    const selection = await SelectionRepository.findOrCreate(galleryId, client.email, client.name, client.id)
    const photoIds  = await SelectionRepository.getPhotoIds(selection.id)

    if (photoIds.includes(photoId)) {
      await SelectionRepository.removePhoto(selection.id, photoId)
      return { photoId, selected: false }
    }

    await SelectionRepository.addPhoto(selection.id, photoId)
    return { photoId, selected: true }
  },

  async submitSelection(galleryId: string, clientToken?: string): Promise<{ submittedAt: string }> {
    await assertSelectionAllowed(galleryId)

    const client    = await resolveClient(clientToken)
    const selection = await SelectionRepository.findOrCreate(galleryId, client.email, client.name, client.id)

    if (selection.submittedAt) {
      return { submittedAt: selection.submittedAt.toISOString() }
    }

    const photoIds = await SelectionRepository.getPhotoIds(selection.id)
    if (photoIds.length === 0) {
      throw Object.assign(new Error('No photos selected'), { status: 422 })
    }

    await SelectionRepository.submit(selection.id)
    await GalleryRepository.updateClientActivity(galleryId, ClientActivity.SUBMITTED)
    await QueueProvider.enqueueNotification('SELECTION_SUBMITTED', {
      galleryId,
      selectionId: selection.id,
      photoCount:  photoIds.length,
    })
    ActivityService.log(galleryId, 'SELECTION_SUBMITTED', { photoCount: photoIds.length })

    return { submittedAt: new Date().toISOString() }
  },
}
