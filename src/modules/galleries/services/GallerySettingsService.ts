import { DownloadType, GalleryStatus } from '@prisma/client'
import { GallerySettingsRepository, type UpdateSettingsInput } from '../repositories/GallerySettingsRepository'

const DOWNLOAD_TYPE_VALUES = new Set<DownloadType>([
  'NONE', 'WATERMARKED', 'FINAL_EDITED', 'ORIGINALS', 'SELECTED_ONLY', 'FULL_GALLERY',
])
const STATUS_VALUES        = new Set<GalleryStatus>(['DRAFT', 'ACTIVE', 'ARCHIVED'])
const COVER_STYLE_VALUES   = new Set(['fullscreen', 'split', 'minimal'])
const LAYOUT_VALUES        = new Set(['masonry', 'editorial', 'uniform'])
const TYPOGRAPHY_VALUES    = new Set(['serif', 'modern', 'minimal'])
const COLOR_THEME_VALUES   = new Set(['dark', 'light', 'warm'])

export const GallerySettingsService = {
  async getSettings(galleryId: string, photographerId: string) {
    const row = await GallerySettingsRepository.findSettings(galleryId)
    if (!row) throw Object.assign(new Error('Not found'), { status: 404 })
    if (row.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })

    return {
      id:                row.id,
      title:             row.title,
      subtitle:          row.subtitle ?? null,
      eventDate:         row.eventDate ?? null,
      coverPhotoId:      row.coverPhotoId ?? null,
      coverStyle:        row.coverStyle,
      galleryLayout:     row.galleryLayout,
      typographyStyle:   row.typographyStyle,
      colorTheme:        row.colorTheme,
      tags:              row.tags,
      status:            row.status,
      shareToken:        row.shareToken,
      hasPassword:       !!row.password,
      expiresAt:         row.expiresAt?.toISOString() ?? null,
      allowSelection:    row.allowSelection,
      allowFavorites:    row.allowFavorites,
      allowComments:     row.allowComments,
      requireClientInfo: row.requireClientInfo,
      downloadEnabled:    row.downloadEnabled,
      downloadType:       row.downloadType,
      watermarkEnabled:   row.watermarkEnabled,
      watermarkPresetId:  row.watermarkPresetId ?? null,
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
    if ('eventDate' in body) {
      data.eventDate = typeof body.eventDate === 'string' && body.eventDate.trim()
        ? body.eventDate.trim()
        : null
    }
    if ('coverPhotoId' in body) {
      data.coverPhotoId = typeof body.coverPhotoId === 'string' && body.coverPhotoId.trim()
        ? body.coverPhotoId.trim()
        : null
    }
    if (typeof body.coverStyle === 'string') {
      if (!COVER_STYLE_VALUES.has(body.coverStyle))
        throw Object.assign(new Error('Invalid coverStyle'), { status: 400 })
      data.coverStyle = body.coverStyle
    }
    if (typeof body.galleryLayout === 'string') {
      if (!LAYOUT_VALUES.has(body.galleryLayout))
        throw Object.assign(new Error('Invalid galleryLayout'), { status: 400 })
      data.galleryLayout = body.galleryLayout
    }
    if (typeof body.typographyStyle === 'string') {
      if (!TYPOGRAPHY_VALUES.has(body.typographyStyle))
        throw Object.assign(new Error('Invalid typographyStyle'), { status: 400 })
      data.typographyStyle = body.typographyStyle
    }
    if (typeof body.colorTheme === 'string') {
      if (!COLOR_THEME_VALUES.has(body.colorTheme))
        throw Object.assign(new Error('Invalid colorTheme'), { status: 400 })
      data.colorTheme = body.colorTheme
    }
    if (Array.isArray(body.tags)) {
      const cleaned = body.tags
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0 && t.length <= 30)
        .slice(0, 20) // max 20 tags
      data.tags = [...new Set(cleaned)]
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
    if ('watermarkPresetId' in body) {
      data.watermarkPresetId = typeof body.watermarkPresetId === 'string' && body.watermarkPresetId.trim()
        ? body.watermarkPresetId.trim()
        : null
    }
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
      eventDate:         updated.eventDate ?? null,
      coverPhotoId:      updated.coverPhotoId ?? null,
      coverStyle:        updated.coverStyle,
      galleryLayout:     updated.galleryLayout,
      typographyStyle:   updated.typographyStyle,
      colorTheme:        updated.colorTheme,
      tags:              updated.tags,
      status:            updated.status,
      shareToken:        updated.shareToken,
      hasPassword:       !!updated.password,
      expiresAt:         updated.expiresAt?.toISOString() ?? null,
      allowSelection:    updated.allowSelection,
      allowFavorites:    updated.allowFavorites,
      allowComments:     updated.allowComments,
      requireClientInfo: updated.requireClientInfo,
      downloadEnabled:    updated.downloadEnabled,
      downloadType:       updated.downloadType,
      watermarkEnabled:   updated.watermarkEnabled,
      watermarkPresetId:  updated.watermarkPresetId ?? null,
    }
  },
}
