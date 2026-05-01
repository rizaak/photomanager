import { PhotographerRepository } from '../repositories/PhotographerRepository'

const GB = BigInt(1024 * 1024 * 1024)
const WARN_THRESHOLD = 0.80   // 80 %

export interface UsageData {
  storage: {
    usedBytes: number
    limitBytes: number
    usedGB:    number
    limitGB:   number
    percent:   number
    warning:   boolean   // ≥ 80 %
    exceeded:  boolean   // ≥ 100 %
  }
}

export const UsageService = {
  async getUsage(photographerId: string): Promise<UsageData> {
    const profile = await PhotographerRepository.findForUsage(photographerId)
    if (!profile) throw Object.assign(new Error('Photographer not found'), { status: 404 })

    const limitGB    = profile.storageLimitGB
    const limitBytes = BigInt(limitGB) * GB
    const usedBytes  = profile.storageUsedBytes
    const percent    = limitBytes > BigInt(0)
      ? Math.min(100, Number((usedBytes * BigInt(10000)) / limitBytes) / 100)
      : 0

    return {
      storage: {
        usedBytes:  Number(usedBytes),
        limitBytes: Number(limitBytes),
        usedGB:     Math.round((Number(usedBytes) / (1024 ** 3)) * 100) / 100,
        limitGB,
        percent:    Math.round(percent * 10) / 10,
        warning:    percent >= WARN_THRESHOLD * 100,
        exceeded:   usedBytes >= limitBytes,
      },
    }
  },

  async checkStorageLimit(photographerId: string, bytesToAdd: number): Promise<void> {
    const profile = await PhotographerRepository.findForUsage(photographerId)
    if (!profile) throw Object.assign(new Error('Photographer not found'), { status: 404 })

    const limitBytes = BigInt(profile.storageLimitGB) * GB
    const projected  = profile.storageUsedBytes + BigInt(bytesToAdd)

    if (projected > limitBytes) {
      throw Object.assign(
        new Error(`Storage limit reached. You have ${profile.storageLimitGB} GB included in your plan.`),
        { status: 422 },
      )
    }
  },

  async incrementStorage(photographerId: string, bytes: number): Promise<void> {
    await PhotographerRepository.incrementStorageUsed(photographerId, BigInt(bytes))
  },

  async decrementStorage(photographerId: string, bytes: number): Promise<void> {
    await PhotographerRepository.decrementStorageUsed(photographerId, BigInt(bytes))
  },
}
