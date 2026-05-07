import { generateApiKey, ImportKeyRepository } from '../repositories/ImportKeyRepository'

export const ImportKeyService = {
  async create(photographerId: string, defaultGalleryId?: string, label?: string) {
    const { plaintext, hash } = generateApiKey()
    const record = await ImportKeyRepository.create({
      photographerId,
      defaultGalleryId: defaultGalleryId || undefined,
      label,
      keyHash: hash,
    })

    return {
      id:               record.id,
      key:              plaintext,       // shown once — never stored or retrievable again
      label:            record.label,
      defaultGalleryId: record.defaultGalleryId,
      createdAt:        record.createdAt,
    }
  },

  async list(photographerId: string) {
    return ImportKeyRepository.listForPhotographer(photographerId)
  },

  async revoke(keyId: string, photographerId: string) {
    const result = await ImportKeyRepository.revoke(keyId, photographerId)
    if (result.count === 0) throw Object.assign(new Error('Key not found'), { status: 404 })
  },
}
