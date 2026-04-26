import { DownloadType } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'

export interface CreatePresetInput {
  name:              string
  isDefault?:        boolean
  allowSelection?:   boolean
  allowFavorites?:   boolean
  allowComments?:    boolean
  requireClientInfo?: boolean
  downloadEnabled?:  boolean
  downloadType?:     DownloadType
  watermarkEnabled?: boolean
  expiresInDays?:    number | null
}

const PRESET_SELECT = {
  id:                true,
  name:              true,
  isDefault:         true,
  allowSelection:    true,
  allowFavorites:    true,
  allowComments:     true,
  requireClientInfo: true,
  downloadEnabled:   true,
  downloadType:      true,
  watermarkEnabled:  true,
  expiresInDays:     true,
  createdAt:         true,
} as const

export const PresetRepository = {
  async findAll(photographerId: string) {
    return prisma.galleryPreset.findMany({
      where:   { photographerId },
      select:  PRESET_SELECT,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })
  },

  async findById(id: string) {
    return prisma.galleryPreset.findUnique({
      where:  { id },
      select: { ...PRESET_SELECT, photographerId: true },
    })
  },

  async create(photographerId: string, data: CreatePresetInput) {
    return prisma.galleryPreset.create({
      data:   { photographerId, ...data },
      select: PRESET_SELECT,
    })
  },

  async update(id: string, data: Partial<CreatePresetInput>) {
    return prisma.galleryPreset.update({
      where:  { id },
      data,
      select: PRESET_SELECT,
    })
  },

  async delete(id: string) {
    await prisma.galleryPreset.delete({ where: { id } })
  },

  async clearDefault(photographerId: string) {
    await prisma.galleryPreset.updateMany({
      where: { photographerId, isDefault: true },
      data:  { isDefault: false },
    })
  },
}
