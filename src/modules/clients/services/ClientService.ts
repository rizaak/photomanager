import { ClientRepository } from '../repositories/ClientRepository'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface RegisteredClient {
  id:          string
  name:        string
  email:       string
  accessToken: string
  isNew:       boolean
}

export interface ClientSnapshot {
  id:             string
  name:           string
  email:          string
  accessedAt:     string   // first registered
  lastAccessedAt: string   // most recent visit
  photoCount:     number
  submittedAt:    string | null
  favoritesCount: number
  commentsCount:  number
}

export const ClientService = {
  /**
   * Register a client for a gallery (or return their existing record).
   * Called from the public gallery access endpoint.
   * Returns isNew = true only for brand-new registrations.
   */
  async register(galleryId: string, email: string, name: string): Promise<RegisteredClient> {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName  = name.trim()

    if (!trimmedEmail || !trimmedName) {
      throw Object.assign(new Error('Name and email are required'), { status: 400 })
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      throw Object.assign(new Error('A valid email address is required'), { status: 400 })
    }
    if (trimmedName.length < 2) {
      throw Object.assign(new Error('Name must be at least 2 characters'), { status: 400 })
    }

    const { client, isNew } = await ClientRepository.findOrCreate(galleryId, trimmedEmail, trimmedName)
    return {
      id:          client.id,
      name:        client.name,
      email:       client.email,
      accessToken: client.accessToken,
      isNew,
    }
  },

  /**
   * Validate an access token for a specific gallery.
   * Returns the client or null if the token is invalid / belongs to a different gallery.
   */
  async validateToken(accessToken: string, galleryId: string) {
    if (!accessToken) return null
    const client = await ClientRepository.findByToken(accessToken)
    if (!client || client.galleryId !== galleryId) return null
    return client
  },

  /** List all registered clients for a gallery (photographer view). */
  async listForGallery(galleryId: string): Promise<ClientSnapshot[]> {
    const rows = await ClientRepository.findByGallery(galleryId)
    return rows.map((c) => ({
      id:             c.id,
      name:           c.name,
      email:          c.email,
      accessedAt:     c.createdAt.toISOString(),
      lastAccessedAt: c.lastAccessedAt.toISOString(),
      photoCount:     c.selections[0]?._count.items ?? 0,
      submittedAt:    c.selections[0]?.submittedAt?.toISOString() ?? null,
      favoritesCount: c._count.favorites,
      commentsCount:  c._count.comments,
    }))
  },
}
