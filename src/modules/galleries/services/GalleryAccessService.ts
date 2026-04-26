import { GalleryStatus } from '@prisma/client'
import { GalleryRepository } from '../repositories/GalleryRepository'
import { ClientService } from '../../clients/services/ClientService'

export interface GalleryAccess {
  id:              string
  title:           string
  allowSelection:  boolean
  allowDownload:   boolean
  clientToken?:    string  // present when requireClientInfo is true
}

export type AccessResult =
  | { gate: 'open';               access: GalleryAccess }
  | { gate: 'password_required' }
  | { gate: 'wrong_password' }
  | { gate: 'registration_required' }

/**
 * Validates a share token and resolves all access gates in sequence:
 * 1. Gallery exists and is not archived
 * 2. Password correct (if set)
 * 3. Client registered (if requireClientInfo is true)
 */
export const GalleryAccessService = {
  async resolveAccess(
    token: string,
    opts: {
      password?:    string
      clientToken?: string
      name?:        string
      email?:       string
    } = {},
  ): Promise<AccessResult> {
    const gallery = await GalleryRepository.findByShareToken(token)

    if (!gallery || gallery.status === GalleryStatus.ARCHIVED) {
      throw Object.assign(new Error('Gallery not found'), { status: 404 })
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
      // New client — register with name + email
      } else if (opts.name && opts.email) {
        const registered = await ClientService.register(gallery.id, opts.email, opts.name)
        clientToken = registered.accessToken
      } else {
        return { gate: 'registration_required' }
      }
    }

    return {
      gate: 'open',
      access: {
        id:             gallery.id,
        title:          gallery.title,
        allowSelection: gallery.allowSelection,
        allowDownload:  gallery.downloadEnabled,
        clientToken,
      },
    }
  },
}
