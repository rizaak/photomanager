import { WatermarkPosition } from '@prisma/client'
import { WatermarkRepository } from '../repositories/WatermarkRepository'
import { storageProvider } from '../../../infrastructure/storage/StorageProvider'

const VALID_POSITIONS = new Set<WatermarkPosition>([
  'CENTER', 'TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT',
])

export const WatermarkService = {
  async list(photographerId: string) {
    const presets = await WatermarkRepository.list(photographerId)
    return Promise.all(
      presets.map(async (p) => ({
        ...p,
        createdAt:  p.createdAt.toISOString(),
        updatedAt:  p.updatedAt.toISOString(),
        previewUrl: await storageProvider.getSignedUrl(p.imageKey, 3600),
      })),
    )
  },

  async get(id: string, photographerId: string) {
    const preset = await WatermarkRepository.findById(id)
    if (!preset) throw Object.assign(new Error('Not found'), { status: 404 })
    if (preset.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })
    return {
      ...preset,
      createdAt:  preset.createdAt.toISOString(),
      updatedAt:  preset.updatedAt.toISOString(),
      previewUrl: await storageProvider.getSignedUrl(preset.imageKey, 3600),
    }
  },

  async create(
    photographerId: string,
    body: {
      name:      string
      imageKey:  string
      position?: string
      sizePct?:  number
      opacity?:  number
      isDefault?: boolean
    },
  ) {
    if (!body.name?.trim()) throw Object.assign(new Error('name is required'), { status: 400 })
    if (!body.imageKey?.trim()) throw Object.assign(new Error('imageKey is required'), { status: 400 })

    const position = (body.position ?? 'CENTER') as WatermarkPosition
    if (!VALID_POSITIONS.has(position)) throw Object.assign(new Error('Invalid position'), { status: 400 })

    const sizePct = body.sizePct ?? 20
    if (typeof sizePct !== 'number' || sizePct < 5 || sizePct > 60)
      throw Object.assign(new Error('sizePct must be between 5 and 60'), { status: 400 })

    const opacity = body.opacity ?? 40
    if (typeof opacity !== 'number' || opacity < 5 || opacity > 100)
      throw Object.assign(new Error('opacity must be between 5 and 100'), { status: 400 })

    const isDefault = body.isDefault ?? false
    if (isDefault) await WatermarkRepository.clearDefaults(photographerId)

    return WatermarkRepository.create({
      photographerId,
      name:      body.name.trim(),
      imageKey:  body.imageKey.trim(),
      position,
      sizePct,
      opacity,
      isDefault,
    })
  },

  async update(
    id: string,
    photographerId: string,
    body: Record<string, unknown>,
  ) {
    const preset = await WatermarkRepository.findById(id)
    if (!preset) throw Object.assign(new Error('Not found'), { status: 404 })
    if (preset.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })

    const patch: Parameters<typeof WatermarkRepository.update>[1] = {}

    if (typeof body.name === 'string') {
      const n = body.name.trim()
      if (!n) throw Object.assign(new Error('name cannot be empty'), { status: 400 })
      patch.name = n
    }
    if (typeof body.imageKey === 'string') {
      const k = body.imageKey.trim()
      if (!k) throw Object.assign(new Error('imageKey cannot be empty'), { status: 400 })
      if (k !== preset.imageKey) {
        // Delete the old watermark image from storage when replacing
        try { await storageProvider.delete(preset.imageKey) } catch { /* non-critical */ }
        patch.imageKey = k
      }
    }
    if (typeof body.position === 'string') {
      if (!VALID_POSITIONS.has(body.position as WatermarkPosition))
        throw Object.assign(new Error('Invalid position'), { status: 400 })
      patch.position = body.position as WatermarkPosition
    }
    if (typeof body.sizePct === 'number') {
      if (body.sizePct < 5 || body.sizePct > 60)
        throw Object.assign(new Error('sizePct must be between 5 and 60'), { status: 400 })
      patch.sizePct = body.sizePct
    }
    if (typeof body.opacity === 'number') {
      if (body.opacity < 5 || body.opacity > 100)
        throw Object.assign(new Error('opacity must be between 5 and 100'), { status: 400 })
      patch.opacity = body.opacity
    }
    if (typeof body.isDefault === 'boolean') {
      if (body.isDefault) await WatermarkRepository.clearDefaults(photographerId)
      patch.isDefault = body.isDefault
    }
    if (typeof body.isActive === 'boolean') patch.isActive = body.isActive

    return WatermarkRepository.update(id, patch)
  },

  async delete(id: string, photographerId: string) {
    const preset = await WatermarkRepository.findById(id)
    if (!preset) throw Object.assign(new Error('Not found'), { status: 404 })
    if (preset.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })
    await storageProvider.delete(preset.imageKey)
    await WatermarkRepository.delete(id)
  },

  async uploadImage(photographerId: string, file: File): Promise<string> {
    const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
    if (!ALLOWED.has(file.type)) throw Object.assign(new Error('Invalid file type — PNG, JPEG, WebP, or SVG only'), { status: 400 })
    if (file.size > 5 * 1024 * 1024) throw Object.assign(new Error('File too large — max 5 MB'), { status: 400 })

    const ext = file.type === 'image/svg+xml' ? 'svg' : file.type.split('/')[1]
    const key = `watermarks/${photographerId}/${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await storageProvider.upload(key, buffer, file.type)
    return key
  },
}
