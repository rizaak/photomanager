import { DownloadType } from '@prisma/client'
import { PresetRepository, type CreatePresetInput } from '../repositories/PresetRepository'

const DOWNLOAD_TYPE_VALUES = new Set<DownloadType>([
  'NONE', 'WATERMARKED', 'FINAL_EDITED', 'ORIGINALS', 'SELECTED_ONLY', 'FULL_GALLERY',
])

function parseBody(body: Record<string, unknown>): CreatePresetInput {
  if (typeof body.name !== 'string' || !body.name.trim())
    throw Object.assign(new Error('name is required'), { status: 400 })

  if ('downloadType' in body && typeof body.downloadType === 'string') {
    if (!DOWNLOAD_TYPE_VALUES.has(body.downloadType as DownloadType))
      throw Object.assign(new Error('Invalid downloadType'), { status: 400 })
  }
  if ('expiresInDays' in body && body.expiresInDays !== null && typeof body.expiresInDays !== 'number')
    throw Object.assign(new Error('expiresInDays must be a number or null'), { status: 400 })

  return {
    name:              body.name.trim(),
    allowSelection:    typeof body.allowSelection    === 'boolean' ? body.allowSelection    : undefined,
    allowFavorites:    typeof body.allowFavorites    === 'boolean' ? body.allowFavorites    : undefined,
    allowComments:     typeof body.allowComments     === 'boolean' ? body.allowComments     : undefined,
    requireClientInfo: typeof body.requireClientInfo === 'boolean' ? body.requireClientInfo : undefined,
    downloadEnabled:   typeof body.downloadEnabled   === 'boolean' ? body.downloadEnabled   : undefined,
    watermarkEnabled:  typeof body.watermarkEnabled  === 'boolean' ? body.watermarkEnabled  : undefined,
    downloadType:      typeof body.downloadType      === 'string'  ? body.downloadType as DownloadType : undefined,
    expiresInDays:     typeof body.expiresInDays     === 'number'  ? body.expiresInDays     :
                       body.expiresInDays === null                 ? null                   : undefined,
  }
}

export const PresetService = {
  async list(photographerId: string) {
    const rows = await PresetRepository.findAll(photographerId)
    return rows.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))
  },

  async create(photographerId: string, body: Record<string, unknown>) {
    const data = parseBody(body)
    if (data.isDefault) await PresetRepository.clearDefault(photographerId)
    return PresetRepository.create(photographerId, data)
  },

  async update(presetId: string, photographerId: string, body: Record<string, unknown>) {
    const preset = await PresetRepository.findById(presetId)
    if (!preset) throw Object.assign(new Error('Not found'), { status: 404 })
    if (preset.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })

    const { name: _n, ...rest } = parseBody({ name: preset.name, ...body })
    const data: Partial<CreatePresetInput> = rest
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()

    if (typeof body.isDefault === 'boolean') {
      data.isDefault = body.isDefault
      if (body.isDefault) await PresetRepository.clearDefault(photographerId)
    }

    return PresetRepository.update(presetId, data)
  },

  async delete(presetId: string, photographerId: string) {
    const preset = await PresetRepository.findById(presetId)
    if (!preset) throw Object.assign(new Error('Not found'), { status: 404 })
    if (preset.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })
    await PresetRepository.delete(presetId)
  },

  async getDefault(photographerId: string) {
    const all = await PresetRepository.findAll(photographerId)
    return all.find((p) => p.isDefault) ?? null
  },
}
