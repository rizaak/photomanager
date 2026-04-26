import { ClientRepository } from '../repositories/ClientRepository'

export interface RegisteredClient {
  id:          string
  name:        string
  email:       string
  accessToken: string
}

export interface ClientSnapshot {
  id:          string
  name:        string
  email:       string
  accessedAt:  string
  photoCount:  number
  submittedAt: string | null
}

export const ClientService = {
  /**
   * Register a client for a gallery (or return their existing record).
   * Called from the public gallery access endpoint.
   */
  async register(galleryId: string, email: string, name: string): Promise<RegisteredClient> {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName  = name.trim()

    if (!trimmedEmail || !trimmedName) {
      throw Object.assign(new Error('Name and email are required'), { status: 400 })
    }

    const client = await ClientRepository.findOrCreate(galleryId, trimmedEmail, trimmedName)
    return {
      id:          client.id,
      name:        client.name,
      email:       client.email,
      accessToken: client.accessToken,
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
      id:          c.id,
      name:        c.name,
      email:       c.email,
      accessedAt:  c.createdAt.toISOString(),
      photoCount:  c.selections[0]?._count.items ?? 0,
      submittedAt: c.selections[0]?.submittedAt?.toISOString() ?? null,
    }))
  },
}
