import { DownloadType, GalleryStatus } from '@prisma/client'
import { GallerySettingsRepository, type UpdateSettingsInput } from '../repositories/GallerySettingsRepository'

const DOWNLOAD_TYPE_VALUES = new Set<DownloadType>([
  'NONE', 'WATERMARKED', 'FINAL_EDITED', 'ORIGINALS', 'SELECTED_ONLY', 'FULL_GALLERY',
])
const STATUS_VALUES = new Set<GalleryStatus>(['DRAFT', 'ACTIVE', 'ARCHIVED'])

export const GallerySettingsService = {
  async getSettings(galleryId: string, photographerId: string) {
    const row = await GallerySettingsRepository.findSettings(galleryId)
    if (!row) throw Object.assign(new Error('Not found'), { status: 404 })
    if (row.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })

    return {
      id:                row.id,
      title:             row.title,
      subtitle:          row.subtitle ?? null,
      status:            row.status,
      shareToken:        row.shareToken,
      hasPassword:       !!row.password,
      expiresAt:         row.expiresAt?.toISOString() ?? null,
      allowSelection:    row.allowSelection,
      allowFavorites:    row.allowFavorites,
      allowComments:     row.allowComments,
      requireClientInfo: row.requireClientInfo,
      downloadEnabled:   row.downloadEnabled,
      downloadType:      row.downloadType,
      watermarkEnabled:  row.watermarkEnabled,
    }
  },

  async updateSettings(
    galleryId: string,
    photographerId: string,
    body: Record<string, unknown>,
  ) {
    const row = await GallerySettingsRepository.findSettings(galleryId)
    if (!row) throw Object.assign(new Error('Not found'), { status: 404 })
    if (row.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })

    const data: UpdateSettingsInput = {}

    if (typeof body.title === 'string') {
      const t = body.title.trim()
      if (!t) throw Object.assign(new Error('title cannot be empty'), { status: 400 })
      data.title = t
    }
    if ('subtitle' in body) {
      data.subtitle = typeof body.subtitle === 'string' && body.subtitle.trim()
        ? body.subtitle.trim()
        : null
    }
    if (typeof body.status === 'string') {
      if (!STATUS_VALUES.has(body.status as GalleryStatus))
        throw Object.assign(new Error('Invalid status'), { status: 400 })
      data.status = body.status as GalleryStatus
    }
    if ('password' in body) {
      data.password = typeof body.password === 'string' && body.password.trim()
        ? body.password.trim()
        : null
    }
    if ('expiresAt' in body) {
      if (body.expiresAt === null) {
        data.expiresAt = null
      } else if (typeof body.expiresAt === 'string') {
        const d = new Date(body.expiresAt)
        if (isNaN(d.getTime())) throw Object.assign(new Error('Invalid expiresAt'), { status: 400 })
        data.expiresAt = d
      }
    }
    if (typeof body.allowSelection === 'boolean')    data.allowSelection    = body.allowSelection
    if (typeof body.allowFavorites === 'boolean')    data.allowFavorites    = body.allowFavorites
    if (typeof body.allowComments === 'boolean')     data.allowComments     = body.allowComments
    if (typeof body.requireClientInfo === 'boolean') data.requireClientInfo = body.requireClientInfo
    if (typeof body.downloadEnabled === 'boolean')   data.downloadEnabled   = body.downloadEnabled
    if (typeof body.watermarkEnabled === 'boolean')  data.watermarkEnabled  = body.watermarkEnabled
    if (typeof body.downloadType === 'string') {
      if (!DOWNLOAD_TYPE_VALUES.has(body.downloadType as DownloadType))
        throw Object.assign(new Error('Invalid downloadType'), { status: 400 })
      data.downloadType = body.downloadType as DownloadType
    }

    const updated = await GallerySettingsRepository.update(galleryId, data)

    return {
      id:                updated.id,
      title:             updated.title,
      subtitle:          updated.subtitle ?? null,
      status:            updated.status,
      shareToken:        updated.shareToken,
      hasPassword:       !!updated.password,
      expiresAt:         updated.expiresAt?.toISOString() ?? null,
      allowSelection:    updated.allowSelection,
      allowFavorites:    updated.allowFavorites,
      allowComments:     updated.allowComments,
      requireClientInfo: updated.requireClientInfo,
      downloadEnabled:   updated.downloadEnabled,
      downloadType:      updated.downloadType,
      watermarkEnabled:  updated.watermarkEnabled,
    }
  },
}
