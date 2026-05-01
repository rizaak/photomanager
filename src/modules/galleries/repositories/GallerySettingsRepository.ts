import { DownloadType } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'

export interface UpdateSettingsInput {
  // Presentation
  title?:             string
  subtitle?:          string | null
  eventDate?:         string | null
  coverPhotoId?:      string | null
  coverStyle?:        string
  galleryLayout?:     string
  typographyStyle?:   string
  colorTheme?:        string
  tags?:              string[]
  // Access
  password?:          string | null
  expiresAt?:         Date | null
  status?:            'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  // Client interaction
  allowSelection?:    boolean
  allowFavorites?:    boolean
  allowComments?:     boolean
  requireClientInfo?: boolean
  // Downloads
  downloadEnabled?:   boolean
  downloadType?:      DownloadType
  // Protection
  watermarkEnabled?:   boolean
  watermarkPresetId?:  string | null
}

export const GallerySettingsRepository = {
  async findSettings(galleryId: string) {
    return prisma.gallery.findUnique({
      where:  { id: galleryId },
      select: {
        id:                true,
        title:             true,
        subtitle:          true,
        eventDate:         true,
        coverPhotoId:      true,
        coverStyle:        true,
        galleryLayout:     true,
        typographyStyle:   true,
        colorTheme:        true,
        tags:              true,
        status:            true,
        shareToken:        true,
        password:          true,
        expiresAt:         true,
        allowSelection:    true,
        allowFavorites:    true,
        allowComments:     true,
        requireClientInfo: true,
        downloadEnabled:    true,
        downloadType:       true,
        watermarkEnabled:   true,
        watermarkPresetId:  true,
        photographerId:     true,
      },
    })
  },

  async update(galleryId: string, data: UpdateSettingsInput) {
    return prisma.gallery.update({
      where: { id: galleryId },
      data,
      select: {
        id:                true,
        title:             true,
        subtitle:          true,
        eventDate:         true,
        coverPhotoId:      true,
        coverStyle:        true,
        galleryLayout:     true,
        typographyStyle:   true,
        colorTheme:        true,
        tags:              true,
        status:            true,
        shareToken:        true,
        password:          true,
        expiresAt:         true,
        allowSelection:    true,
        allowFavorites:    true,
        allowComments:     true,
        requireClientInfo: true,
        downloadEnabled:    true,
        downloadType:       true,
        watermarkEnabled:   true,
        watermarkPresetId:  true,
      },
    })
  },
}
