import { FavoriteRepository } from '../repositories/FavoriteRepository'
import { CommentRepository } from '../../comments/repositories/CommentRepository'
import { ClientRepository } from '../../clients/repositories/ClientRepository'
import { GalleryRepository } from '../../galleries/repositories/GalleryRepository'
import { ActivityService } from '../../activity/services/ActivityService'

async function resolveClientId(clientToken: string | undefined, galleryId: string): Promise<string | null> {
  if (!clientToken) return null
  const client = await ClientRepository.findByToken(clientToken)
  if (!client || client.galleryId !== galleryId) return null
  return client.id
}

export const FavoriteService = {
  /** Toggle a photo favorite. Requires a registered client. */
  async toggle(galleryId: string, photoId: string, clientToken: string | undefined) {
    const perms = await GalleryRepository.findPermissions(galleryId)
    if (!perms) throw Object.assign(new Error('Gallery not found'), { status: 404 })
    if (!perms.allowFavorites) {
      throw Object.assign(new Error('Favorites are not enabled for this gallery'), { status: 403 })
    }

    const galleryClientId = await resolveClientId(clientToken, galleryId)
    if (!galleryClientId) {
      throw Object.assign(new Error('Client token required to favorite photos'), { status: 401 })
    }

    const favorited = await FavoriteRepository.toggle(galleryClientId, galleryId, photoId)
    ActivityService.log(galleryId, favorited ? 'PHOTO_FAVORITED' : 'PHOTO_UNFAVORITED', { photoId })
    return { photoId, favorited }
  },

  /**
   * Get all favorited photo IDs + the client's own per-photo comments.
   * Both are returned in one call to minimise round-trips on page load.
   */
  async getForClient(galleryId: string, clientToken: string | undefined) {
    const galleryClientId = await resolveClientId(clientToken, galleryId)
    if (!galleryClientId) return { photoIds: [], comments: [] }

    const [photoIds, commentRows] = await Promise.all([
      FavoriteRepository.findPhotoIds(galleryClientId, galleryId),
      CommentRepository.findByClient(galleryClientId, galleryId),
    ])

    return {
      photoIds,
      comments: commentRows.map((c) => ({
        id:       c.id,
        photoId:  c.photoId!,
        body:     c.body,
        updatedAt: c.updatedAt.toISOString(),
      })),
    }
  },
}
