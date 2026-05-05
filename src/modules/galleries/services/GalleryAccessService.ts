import { GalleryStatus } from '@prisma/client'
import { GalleryRepository } from '../repositories/GalleryRepository'
import { ClientService } from '../../clients/services/ClientService'
import { ActivityService } from '../../activity/services/ActivityService'
import { QueueProvider } from '../../../infrastructure/queue/QueueProvider'

const FINAL_DOWNLOAD_TYPES = new Set(['FINAL_EDITED', 'SELECTED_ONLY', 'FULL_GALLERY'])

export interface GalleryAccess {
  id:                 string
  title:              string
  subtitle:           string | null
  eventDate:          string | null
  coverPhotoId:       string | null
  coverStyle:         string
  galleryLayout:      string
  typographyStyle:    string
  colorTheme:         string
  allowSelection:     boolean
  allowFavorites:     boolean
  allowComments:      boolean
  allowDownload:      boolean  // any download enabled
  allowFinalDownload: boolean  // finals (edited files) specifically available
  clientToken?:       string   // present when requireClientInfo is true and client is registered
}

export type AccessResult =
  | { gate: 'open';               access: GalleryAccess }
  | { gate: 'password_required' }
  | { gate: 'wrong_password' }
  | { gate: 'registration_required' }

/**
 * Validates a share token and resolves all access gates in sequence:
 * 1. Gallery exists and is not archived
 * 2. Draft/expiry gate (skipped for owning photographer in preview mode)
 * 3. Password correct (if set)
 * 4. Client registered (if requireClientInfo is true)
 */
export const GalleryAccessService = {
  async resolveAccess(
    token: string,
    opts: {
      password?:       string
      clientToken?:    string
      name?:           string
      email?:          string
      /** When set, this is a photographer preview — skip DRAFT/expiry gates if they own the gallery */
      photographerId?: string
    } = {},
  ): Promise<AccessResult> {
    const gallery = await GalleryRepository.findByShareToken(token)

    if (!gallery || gallery.status === GalleryStatus.ARCHIVED) {
      throw Object.assign(new Error('Gallery not found'), { status: 404 })
    }

    // Owner bypass: authenticated photographer previewing their own gallery
    const isOwner = opts.photographerId && gallery.photographerId === opts.photographerId

    if (gallery.status === GalleryStatus.DRAFT && !isOwner) {
      throw Object.assign(new Error('Gallery not found'), { status: 404 })
    }

    if (!isOwner && gallery.expiresAt && gallery.expiresAt < new Date()) {
      throw Object.assign(new Error('This gallery has expired'), { status: 410 })
    }

    // ── Gate 1: Password ─────────────────────────────────────────────────────
    if (gallery.password) {
      if (!opts.password) return { gate: 'password_required' }
      if (opts.password !== gallery.password) return { gate: 'wrong_password' }
    }

    // ── Gate 2: Client registration ──────────────────────────────────────────
    let clientToken: string | undefined

    if (gallery.requireClientInfo) {
      // Returning client — validate stored token
      if (opts.clientToken) {
        const client = await ClientService.validateToken(opts.clientToken, gallery.id)
        if (client) {
          clientToken = opts.clientToken
        } else {
          // Invalid/expired token → force re-registration
          return { gate: 'registration_required' }
        }
      // New client (or returning without a token) — register with name + email
      } else if (opts.name && opts.email) {
        const registered = await ClientService.register(gallery.id, opts.email, opts.name)
        clientToken = registered.accessToken

        // Only log + notify for brand-new registrations — not returning clients
        if (registered.isNew) {
          ActivityService.log(gallery.id, 'CLIENT_REGISTERED', {
            email: registered.email,
            name:  registered.name,
          })
          QueueProvider.enqueueNotification('CLIENT_REGISTERED', {
            galleryId:   gallery.id,
            clientName:  registered.name,
            clientEmail: registered.email,
          }).catch((err) => console.error('[GalleryAccessService] enqueue CLIENT_REGISTERED:', err))
        }
      } else {
        return { gate: 'registration_required' }
      }
    }

    // Voluntary registration: register client when name+email provided even when not required
    if (!clientToken && opts.name && opts.email) {
      const registered = await ClientService.register(gallery.id, opts.email, opts.name)
      clientToken = registered.accessToken
      if (registered.isNew) {
        ActivityService.log(gallery.id, 'CLIENT_REGISTERED', { email: registered.email, name: registered.name })
        QueueProvider.enqueueNotification('CLIENT_REGISTERED', {
          galleryId:   gallery.id,
          clientName:  registered.name,
          clientEmail: registered.email,
        }).catch((err) => console.error('[GalleryAccessService] enqueue CLIENT_REGISTERED:', err))
      }
    }

    // Skip activity log in photographer preview mode
    if (!isOwner) {
      ActivityService.log(gallery.id, 'GALLERY_OPENED')
    }

    return {
      gate: 'open',
      access: {
        id:                 gallery.id,
        title:              gallery.title,
        subtitle:           gallery.subtitle ?? null,
        eventDate:          gallery.eventDate ?? null,
        coverPhotoId:       gallery.coverPhotoId ?? null,
        coverStyle:         gallery.coverStyle,
        galleryLayout:      gallery.galleryLayout,
        typographyStyle:    gallery.typographyStyle,
        colorTheme:         gallery.colorTheme,
        allowSelection:     gallery.allowSelection,
        allowFavorites:     gallery.allowFavorites,
        allowComments:      gallery.allowComments,
        allowDownload:      gallery.downloadEnabled,
        allowFinalDownload: gallery.downloadEnabled && FINAL_DOWNLOAD_TYPES.has(gallery.downloadType),
        clientToken,
      },
    }
  },
}
