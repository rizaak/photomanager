import { PhotographerRepository } from '../repositories/PhotographerRepository'

const GB = BigInt(1024 * 1024 * 1024)
const STORAGE_WARN_THRESHOLD = 0.80   // 80 %
const GALLERY_WARN_THRESHOLD = 1      // warn when 1 slot remaining

export interface UsageData {
  plan:     string
  storage: {
    usedBytes: number
    limitBytes: number
    usedGB:    number
    limitGB:   number
    percent:   number
    warning:   boolean   // > 80 %
    exceeded:  boolean   // >= 100 %
  }
  galleries: {
    used:    number
    limit:   number | null
    warning: boolean      // limit reached or 1 remaining
  }
}

export const UsageService = {
  async getUsage(photographerId: string): Promise<UsageData> {
    const [profile, galleryCount] = await Promise.all([
      PhotographerRepository.findWithPlan(photographerId),
      PhotographerRepository.countActiveGalleries(photographerId),
    ])

    if (!profile) throw Object.assign(new Error('Photographer not found'), { status: 404 })

    const limitGB    = profile.plan.storageLimitGB
    const limitBytes = BigInt(limitGB) * GB
    const usedBytes  = profile.storageUsedBytes
    const percent    = limitBytes > BigInt(0)
      ? Math.min(100, Number((usedBytes * BigInt(10000)) / limitBytes) / 100)
      : 0

    const maxGalleries = profile.plan.maxGalleries

    return {
      plan: profile.plan.name,
      storage: {
        usedBytes:  Number(usedBytes),
        limitBytes: Number(limitBytes),
        usedGB:     Math.round((Number(usedBytes) / (1024 ** 3)) * 100) / 100,
        limitGB,
        percent:    Math.round(percent * 10) / 10,
        warning:    percent >= STORAGE_WARN_THRESHOLD * 100,
        exceeded:   usedBytes >= limitBytes,
      },
      galleries: {
        used:    galleryCount,
        limit:   maxGalleries,
        warning: maxGalleries !== null && (galleryCount >= maxGalleries - GALLERY_WARN_THRESHOLD),
      },
    }
  },

  async checkStorageLimit(photographerId: string, bytesToAdd: number): Promise<void> {
    const profile = await PhotographerRepository.findWithPlan(photographerId)
    if (!profile) throw Object.assign(new Error('Photographer not found'), { status: 404 })

    const limitBytes = BigInt(profile.plan.storageLimitGB) * GB
    const projected  = profile.storageUsedBytes + BigInt(bytesToAdd)

    if (projected > limitBytes) {
      throw Object.assign(
        new Error(
          `Storage limit reached. Your ${profile.plan.name} plan includes ${profile.plan.storageLimitGB} GB.`,
        ),
        { status: 422 },
      )
    }
  },

  async checkGalleryLimit(photographerId: string): Promise<void> {
    const profile = await PhotographerRepository.findWithPlan(photographerId)
    if (!profile) throw Object.assign(new Error('Photographer not found'), { status: 404 })

    const max = profile.plan.maxGalleries
    if (max === null) return  // unlimited

    const count = await PhotographerRepository.countActiveGalleries(photographerId)
    if (count >= max) {
      throw Object.assign(
        new Error(
          `Gallery limit reached. Your ${profile.plan.name} plan allows ${max} ${max === 1 ? 'gallery' : 'galleries'}.`,
        ),
        { status: 422 },
      )
    }
  },

  async incrementStorage(photographerId: string, bytes: number): Promise<void> {
    await PhotographerRepository.incrementStorageUsed(photographerId, BigInt(bytes))
  },
}
