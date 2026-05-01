import { WatermarkPosition } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'

export interface CreateWatermarkInput {
  photographerId: string
  name:           string
  imageKey:       string
  position:       WatermarkPosition
  sizePct:        number
  opacity:        number
  isDefault:      boolean
}

export interface UpdateWatermarkInput {
  name?:      string
  imageKey?:  string
  position?:  WatermarkPosition
  sizePct?:   number
  opacity?:   number
  isDefault?: boolean
  isActive?:  boolean
}

export const WatermarkRepository = {
  async list(photographerId: string) {
    return prisma.watermarkPreset.findMany({
      where:   { photographerId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: {
        id:        true,
        name:      true,
        imageKey:  true,
        position:  true,
        sizePct:   true,
        opacity:   true,
        isDefault: true,
        isActive:  true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },

  async findById(id: string) {
    return prisma.watermarkPreset.findUnique({
      where:  { id },
      select: {
        id:            true,
        photographerId: true,
        name:          true,
        imageKey:      true,
        position:      true,
        sizePct:       true,
        opacity:       true,
        isDefault:     true,
        isActive:      true,
        createdAt:     true,
        updatedAt:     true,
      },
    })
  },

  async findDefault(photographerId: string) {
    return prisma.watermarkPreset.findFirst({
      where:   { photographerId, isDefault: true, isActive: true },
      select: {
        id:       true,
        imageKey: true,
        position: true,
        sizePct:  true,
        opacity:  true,
      },
    })
  },

  async create(data: CreateWatermarkInput) {
    return prisma.watermarkPreset.create({
      data,
      select: {
        id:        true,
        name:      true,
        imageKey:  true,
        position:  true,
        sizePct:   true,
        opacity:   true,
        isDefault: true,
        isActive:  true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },

  async update(id: string, data: UpdateWatermarkInput) {
    return prisma.watermarkPreset.update({
      where:  { id },
      data,
      select: {
        id:        true,
        name:      true,
        imageKey:  true,
        position:  true,
        sizePct:   true,
        opacity:   true,
        isDefault: true,
        isActive:  true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },

  async clearDefaults(photographerId: string) {
    await prisma.watermarkPreset.updateMany({
      where: { photographerId, isDefault: true },
      data:  { isDefault: false },
    })
  },

  async delete(id: string) {
    await prisma.watermarkPreset.delete({ where: { id } })
  },
}
