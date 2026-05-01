import { CommentRepository } from '../repositories/CommentRepository'
import { ClientRepository } from '../../clients/repositories/ClientRepository'
import { GalleryRepository } from '../../galleries/repositories/GalleryRepository'
import { ActivityService } from '../../activity/services/ActivityService'
import { QueueProvider } from '../../../infrastructure/queue/QueueProvider'

async function resolveClientId(clientToken: string | undefined, galleryId: string): Promise<{ id: string; name: string; email: string } | null> {
  if (!clientToken) return null
  const client = await ClientRepository.findByToken(clientToken)
  if (!client || client.galleryId !== galleryId) return null
  return client
}

export const CommentService = {
  /** Add a comment from a registered client. */
  async addComment(
    galleryId:   string,
    body:        string,
    clientToken: string | undefined,
    photoId?:    string,
  ) {
    const trimmed = body?.trim()
    if (!trimmed) throw Object.assign(new Error('Comment body is required'), { status: 400 })
    if (trimmed.length > 2000) throw Object.assign(new Error('Comment must be 2000 characters or fewer'), { status: 400 })

    const perms = await GalleryRepository.findPermissions(galleryId)
    if (!perms) throw Object.assign(new Error('Gallery not found'), { status: 404 })
    if (!perms.allowComments) throw Object.assign(new Error('Comments are not enabled for this gallery'), { status: 403 })

    const client = await resolveClientId(clientToken, galleryId)
    if (!client) throw Object.assign(new Error('Client token required to post comments'), { status: 401 })

    const comment = await CommentRepository.create(client.id, galleryId, trimmed, photoId)

    ActivityService.log(galleryId, 'COMMENT_ADDED', { name: client.name, comment: trimmed })
    QueueProvider.enqueueNotification('COMMENT_ADDED', {
      galleryId, clientName: client.name, comment: trimmed,
    }).catch((err) => console.error('[CommentService] enqueue COMMENT_ADDED:', err))

    return {
      id:        comment.id,
      body:      comment.body,
      photoId:   comment.photoId,
      clientName: comment.galleryClient.name,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    }
  },

  /** Edit own comment (client only). */
  async updateComment(
    commentId:   string,
    galleryId:   string,
    body:        string,
    clientToken: string | undefined,
  ) {
    const trimmed = body?.trim()
    if (!trimmed) throw Object.assign(new Error('Comment body is required'), { status: 400 })
    if (trimmed.length > 2000) throw Object.assign(new Error('Comment must be 2000 characters or fewer'), { status: 400 })

    const client = await resolveClientId(clientToken, galleryId)
    if (!client) throw Object.assign(new Error('Unauthorized'), { status: 401 })

    const existing = await CommentRepository.findOne(commentId)
    if (!existing) throw Object.assign(new Error('Comment not found'), { status: 404 })
    if (existing.galleryId !== galleryId) throw Object.assign(new Error('Not found'), { status: 404 })
    if (existing.galleryClientId !== client.id) throw Object.assign(new Error('Forbidden'), { status: 403 })

    const updated = await CommentRepository.update(commentId, trimmed)
    return {
      id:        updated.id,
      body:      updated.body,
      photoId:   updated.photoId,
      updatedAt: updated.updatedAt.toISOString(),
    }
  },

  /** Delete own comment (client only). */
  async deleteComment(
    commentId:   string,
    galleryId:   string,
    clientToken: string | undefined,
  ) {
    const client = await resolveClientId(clientToken, galleryId)
    if (!client) throw Object.assign(new Error('Unauthorized'), { status: 401 })

    const existing = await CommentRepository.findOne(commentId)
    if (!existing) throw Object.assign(new Error('Comment not found'), { status: 404 })
    if (existing.galleryId !== galleryId) throw Object.assign(new Error('Not found'), { status: 404 })
    if (existing.galleryClientId !== client.id) throw Object.assign(new Error('Forbidden'), { status: 403 })

    await CommentRepository.delete(commentId)
  },

  /** All photo-level comments the client wrote in this gallery (for page load). */
  async listForClient(galleryId: string, clientToken: string | undefined) {
    const client = await resolveClientId(clientToken, galleryId)
    if (!client) return { comments: [] }
    const rows = await CommentRepository.findByClient(client.id, galleryId)
    return {
      comments: rows.map((c) => ({
        id:       c.id,
        body:     c.body,
        photoId:  c.photoId!,
        updatedAt: c.updatedAt.toISOString(),
      })),
    }
  },

  /** List all comments for a gallery (photographer view — requires ownership). */
  async listForGallery(galleryId: string, photographerId: string) {
    const gallery = await GalleryRepository.findDetail(galleryId)
    if (!gallery) throw Object.assign(new Error('Not found'), { status: 404 })
    if (gallery.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })

    const rows = await CommentRepository.findByGallery(galleryId)
    return rows.map((c) => ({
      id:          c.id,
      body:        c.body,
      photoId:     c.photoId,
      clientName:  c.galleryClient.name,
      clientEmail: c.galleryClient.email,
      createdAt:   c.createdAt.toISOString(),
      updatedAt:   c.updatedAt.toISOString(),
    }))
  },
}
