import { ClientActivity, DownloadType, GalleryStatus, Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'

export interface GalleryDuplicateSource {
  photographerId:    string
  title:             string
  clientName:        string
  clientEmail:       string | null
  coverStyle:        string
  galleryLayout:     string
  typographyStyle:   string
  colorTheme:        string
  allowSelection:    boolean
  allowFavorites:    boolean
  allowComments:     boolean
  requireClientInfo: boolean
  downloadEnabled:   boolean
  downloadType:      DownloadType
  watermarkEnabled:  boolean
  watermarkPresetId: string | null
  tags:              string[]
  folderId:          string | null
}

export interface CreateGalleryInput {
  title:        string
  clientName:   string
  clientEmail?: string
  password?:    string
}

export interface GalleryListParams {
  search?:               string
  status?:               GalleryStatus
  downloadEnabled?:      boolean
  hasSubmittedSelection?: boolean
  tags?:                 string[]
  folderId?:             string | 'none'
  orderBy?:              Prisma.GalleryOrderByWithRelationInput[]
  skip?:                 number
  take?:                 number
}

export const GalleryRepository = {
  // ── Lookup ─────────────────────────────────────────────────────────────────
  async findPhotographerByEmail(email: string) {
    return prisma.photographerProfile.findFirst({
      where:  { user: { email } },
      select: { id: true },
    })
  },

  async findByShareToken(token: string) {
    return prisma.gallery.findUnique({
      where:  { shareToken: token },
      select: {
        id:                true,
        photographerId:    true,
        title:             true,
        subtitle:          true,
        eventDate:         true,
        coverPhotoId:      true,
        coverStyle:        true,
        galleryLayout:     true,
        typographyStyle:   true,
        colorTheme:        true,
        status:            true,
        expiresAt:         true,
        password:          true,
        allowSelection:    true,
        allowFavorites:    true,
        allowComments:     true,
        downloadEnabled:   true,
        downloadType:      true,
        requireClientInfo: true,
      },
    })
  },

  // Lightweight permissions check for sub-resource endpoints (client-facing actions)
  async findPermissions(galleryId: string) {
    return prisma.gallery.findUnique({
      where:  { id: galleryId },
      select: {
        allowSelection:  true,
        allowFavorites:  true,
        allowComments:   true,
        downloadEnabled: true,
        status:          true,
        expiresAt:       true,
      },
    })
  },

  // Permissions + photographer ownership — used for download authorization
  async findPermissionsWithOwner(galleryId: string) {
    return prisma.gallery.findUnique({
      where:  { id: galleryId },
      select: { photographerId: true, allowSelection: true, downloadEnabled: true },
    })
  },

  async findDetail(galleryId: string) {
    return prisma.gallery.findUnique({
      where: { id: galleryId },
      select: {
        id:              true,
        photographerId:  true,
        title:           true,
        clientName:      true,
        status:          true,
        clientActivity:  true,
        downloadEnabled: true,
        shareToken:      true,
        coverPhotoId:    true,
        _count:          { select: { photos: true } },
        photos: {
          where:   { status: 'READY' as const, thumbnailKey: { not: null as null } },
          orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
          take:    1,
          select:  { id: true, thumbnailKey: true },
        },
        selections: {
          // Prioritise the most recent submitted selection; fall back to latest draft
          where:   { submittedAt: { not: null } },
          orderBy: { submittedAt: 'desc' },
          take:    1,
          select: {
            id:            true,
            submittedAt:   true,
            workflowState: true,
            _count:        { select: { items: true } },
          },
        },
      },
    })
  },

  // ── List ───────────────────────────────────────────────────────────────────
  async findAllForPhotographer(photographerId: string, params: GalleryListParams = {}) {
    const where: Prisma.GalleryWhereInput = { photographerId }

    if (params.search) {
      const term = params.search.trim()
      where.OR = [
        { title:      { contains: term, mode: 'insensitive' } },
        { clientName: { contains: term, mode: 'insensitive' } },
      ]
    }
    if (params.status !== undefined)          where.status          = params.status
    if (params.downloadEnabled !== undefined) where.downloadEnabled = params.downloadEnabled
    if (params.tags && params.tags.length > 0) {
      where.tags = { hasSome: params.tags }
    }
    if (params.hasSubmittedSelection === true) {
      where.selections = { some: { submittedAt: { not: null } } }
    }
    if (params.folderId === 'none') {
      where.folderId = null
    } else if (params.folderId) {
      where.folderId = params.folderId
    }

    const orderBy: Prisma.GalleryOrderByWithRelationInput[] =
      params.orderBy ?? [{ createdAt: 'desc' }]

    const [rows, total] = await Promise.all([
      prisma.gallery.findMany({
        where,
        orderBy,
        skip:   params.skip,
        take:   params.take,
        select: {
          id:              true,
          folderId:        true,
          title:           true,
          clientName:      true,
          status:          true,
          clientActivity:  true,
          downloadEnabled: true,
          shareToken:      true,
          createdAt:       true,
          expiresAt:       true,
          coverPhotoId:    true,
          tags:            true,
          _count:          { select: { photos: true } },
          selections: {
            orderBy: { createdAt: 'desc' as const },
            take:    1,
            select:  { _count: { select: { items: true } } },
          },
          photos: {
            where:   { status: 'READY' as const, thumbnailKey: { not: null as null } },
            orderBy: [
              { sortOrder: 'asc' as const },
              { createdAt: 'asc' as const },
            ],
            take:   1,
            select: { id: true, thumbnailKey: true },
          },
        },
      }),
      prisma.gallery.count({ where }),
    ])

    return { rows, total }
  },

  // ── Tags ───────────────────────────────────────────────────────────────────
  async findDistinctTags(photographerId: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ tag: string }[]>`
      SELECT DISTINCT UNNEST(tags) AS tag
      FROM "Gallery"
      WHERE "photographerId" = ${photographerId}
      ORDER BY tag
    `
    return rows.map((r) => r.tag).filter(Boolean)
  },

  // ── Write ──────────────────────────────────────────────────────────────────
  async create(photographerId: string, data: CreateGalleryInput) {
    return prisma.gallery.create({
      data: {
        photographerId,
        title:       data.title,
        clientName:  data.clientName,
        clientEmail: data.clientEmail,
        password:    data.password,
      },
      select: { id: true, shareToken: true, title: true, clientName: true },
    })
  },

  async delete(galleryId: string): Promise<void> {
    await prisma.gallery.delete({ where: { id: galleryId } })
  },

  async findForDuplicate(galleryId: string): Promise<GalleryDuplicateSource | null> {
    return prisma.gallery.findUnique({
      where:  { id: galleryId },
      select: {
        photographerId:    true,
        title:             true,
        clientName:        true,
        clientEmail:       true,
        coverStyle:        true,
        galleryLayout:     true,
        typographyStyle:   true,
        colorTheme:        true,
        allowSelection:    true,
        allowFavorites:    true,
        allowComments:     true,
        requireClientInfo: true,
        downloadEnabled:   true,
        downloadType:      true,
        watermarkEnabled:  true,
        watermarkPresetId: true,
        tags:              true,
        folderId:          true,
      },
    })
  },

  async duplicate(photographerId: string, source: GalleryDuplicateSource) {
    return prisma.gallery.create({
      data: {
        photographerId,
        title:             `Copy of ${source.title}`,
        clientName:        source.clientName,
        clientEmail:       source.clientEmail ?? undefined,
        coverStyle:        source.coverStyle,
        galleryLayout:     source.galleryLayout,
        typographyStyle:   source.typographyStyle,
        colorTheme:        source.colorTheme,
        allowSelection:    source.allowSelection,
        allowFavorites:    source.allowFavorites,
        allowComments:     source.allowComments,
        requireClientInfo: source.requireClientInfo,
        downloadEnabled:   source.downloadEnabled,
        downloadType:      source.downloadType,
        watermarkEnabled:  source.watermarkEnabled,
        watermarkPresetId: source.watermarkPresetId ?? undefined,
        tags:              source.tags,
        folderId:          source.folderId ?? undefined,
      },
      select: { id: true, shareToken: true, title: true, clientName: true },
    })
  },

  async updateClientActivity(galleryId: string, activity: ClientActivity): Promise<void> {
    await prisma.gallery.update({
      where: { id: galleryId },
      data:  { clientActivity: activity },
    })
  },
}
