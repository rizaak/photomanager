import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/src/infrastructure/database/db'

function hashKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex')
}

export function generateApiKey(): { plaintext: string; hash: string } {
  const plaintext = randomBytes(32).toString('hex')
  return { plaintext, hash: hashKey(plaintext) }
}

export const ImportKeyRepository = {
  async findByHash(keyHash: string) {
    return prisma.lightroomApiKey.findUnique({
      where:  { keyHash },
      select: {
        id:               true,
        photographerId:   true,
        defaultGalleryId: true,
        active:           true,
        label:            true,
      },
    })
  },

  async findByHashFull(keyHash: string) {
    return prisma.lightroomApiKey.findUnique({
      where:  { keyHash },
      select: {
        id:               true,
        photographerId:   true,
        defaultGalleryId: true,
        active:           true,
        label:            true,
        lastUsedAt:       true,
        createdAt:        true,
      },
    })
  },

  async create(opts: {
    photographerId:   string
    defaultGalleryId?: string
    label?:           string
    keyHash:          string
  }) {
    return prisma.lightroomApiKey.create({
      data: {
        photographerId:   opts.photographerId,
        defaultGalleryId: opts.defaultGalleryId ?? null,
        label:            opts.label ?? null,
        keyHash:          opts.keyHash,
      },
      select: { id: true, label: true, defaultGalleryId: true, createdAt: true },
    })
  },

  async listForPhotographer(photographerId: string) {
    return prisma.lightroomApiKey.findMany({
      where:   { photographerId, active: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id:               true,
        label:            true,
        defaultGalleryId: true,
        active:           true,
        lastUsedAt:       true,
        createdAt:        true,
        defaultGallery:   { select: { title: true } },
      },
    })
  },

  async revoke(id: string, photographerId: string) {
    return prisma.lightroomApiKey.updateMany({
      where: { id, photographerId },
      data:  { active: false },
    })
  },

  async touchLastUsed(id: string) {
    await prisma.lightroomApiKey.update({
      where: { id },
      data:  { lastUsedAt: new Date() },
    })
  },

  hashKey,
}
