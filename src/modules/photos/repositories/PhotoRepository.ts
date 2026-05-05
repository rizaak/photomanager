import { EditStatus, PhotoStatus, Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/db'

export interface PhotoListParams {
  q?:             string
  status?:        string   // 'processing'|'ready'|'selected'|'editing'|'final_ready'|'failed'
  sectionId?:     string   // UUID or 'none'
  clientSelected?: boolean
  hasComments?:   boolean
  hasFinal?:      boolean
  labels?:        string[]
  sort?:          string   // 'date_desc'|'date_asc'|'filename'|'selected_first'|'final_first'
  page?:          number
  limit?:         number
}

export interface CreatePhotoInput {
  id: string
  galleryId: string
  filename: string
  originalKey: string
  sizeBytes: bigint
  mimeType: string
}

export interface UpdateProcessedInput {
  thumbnailKey: string
  previewKey: string
  watermarkedKey: string
  width: number
  height: number
  status: PhotoStatus
}

export const PhotoRepository = {
  async create(input: CreatePhotoInput): Promise<void> {
    await prisma.photo.create({
      data: {
        id: input.id,
        galleryId: input.galleryId,
        filename: input.filename,
        originalKey: input.originalKey,
        sizeBytes: input.sizeBytes,
        mimeType: input.mimeType,
        status: PhotoStatus.UPLOADING,
      },
    })
  },

  async findById(id: string) {
    return prisma.photo.findUnique({ where: { id } })
  },

  async updateStatus(id: string, status: PhotoStatus): Promise<void> {
    await prisma.photo.update({ where: { id }, data: { status } })
  },

  async findGalleryWithReadyPhotos(galleryId: string, opts: { publicOnly?: boolean } = {}) {
    const PHOTO_SELECT = {
      id: true,
      galleryId: true,
      filename: true,
      width: true,
      height: true,
      thumbnailKey: true,
      watermarkedKey: true,
    } as const

    const READY_WHERE = {
      status: PhotoStatus.READY,
      thumbnailKey: { not: null as null },
      watermarkedKey: { not: null as null },
    }

    return prisma.gallery.findUnique({
      where: { id: galleryId },
      select: {
        id: true,
        title: true,
        sections: {
          where: opts.publicOnly ? { visibleToClient: true } : undefined,
          orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
          select: {
            id: true,
            title: true,
            sortOrder: true,
            photos: {
              where: READY_WHERE,
              orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
              select: PHOTO_SELECT,
            },
          },
        },
        photos: {
          where: { ...READY_WHERE, sectionId: null },
          orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
          select: PHOTO_SELECT,
        },
      },
    })
  },

  async findNonReadyByGallery(galleryId: string) {
    return prisma.photo.findMany({
      where: {
        galleryId,
        status: { notIn: [PhotoStatus.READY] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, galleryId: true, filename: true, status: true, sectionId: true },
    })
  },

  async findManyByIds(ids: string[]) {
    return prisma.photo.findMany({
      where: { id: { in: ids }, status: PhotoStatus.READY },
      select: { id: true, filename: true, originalKey: true, watermarkedKey: true },
    })
  },

  async updateEditStatus(id: string, editStatus: EditStatus): Promise<void> {
    await prisma.photo.update({ where: { id }, data: { editStatus } })
  },

  async updateFinalKey(id: string, finalKey: string): Promise<void> {
    await prisma.photo.update({
      where: { id },
      data:  { finalKey, editStatus: EditStatus.FINAL_READY },
    })
  },

  async assignSection(id: string, sectionId: string | null): Promise<void> {
    await prisma.photo.update({ where: { id }, data: { sectionId } })
  },

  async updateLabels(id: string, labels: string[]): Promise<void> {
    await prisma.photo.update({ where: { id }, data: { labels } })
  },

  async setAppliedWatermarkPreset(id: string, presetId: string | null): Promise<void> {
    await prisma.photo.update({ where: { id }, data: { appliedWatermarkPresetId: presetId } })
  },

  async updateWatermarkedKey(id: string, watermarkedKey: string): Promise<void> {
    await prisma.photo.update({ where: { id }, data: { watermarkedKey } })
  },

  async deletePhoto(id: string): Promise<{ sizeBytes: bigint; originalKey: string; thumbnailKey: string | null; previewKey: string | null; watermarkedKey: string | null; finalKey: string | null; galleryId: string } | null> {
    const photo = await prisma.photo.findUnique({
      where:  { id },
      select: { sizeBytes: true, originalKey: true, thumbnailKey: true, previewKey: true, watermarkedKey: true, finalKey: true, galleryId: true },
    })
    if (!photo) return null
    await prisma.photo.delete({ where: { id } })
    return photo
  },

  async bulkAssignSection(ids: string[], sectionId: string | null): Promise<void> {
    await prisma.photo.updateMany({ where: { id: { in: ids } }, data: { sectionId } })
  },

  async bulkAddLabels(ids: string[], labels: string[]): Promise<void> {
    // Prisma doesn't support array append in updateMany — use raw SQL
    if (ids.length === 0 || labels.length === 0) return
    await prisma.$executeRaw`
      UPDATE "Photo"
      SET labels = (
        SELECT ARRAY(SELECT DISTINCT unnest(labels || ${labels}::text[]))
      )
      WHERE id = ANY(${ids}::uuid[])
    `
  },

  async bulkRemoveLabels(ids: string[], labels: string[]): Promise<void> {
    if (ids.length === 0 || labels.length === 0) return
    await prisma.$executeRaw`
      UPDATE "Photo"
      SET labels = ARRAY(
        SELECT unnest(labels)
        EXCEPT
        SELECT unnest(${labels}::text[])
      )
      WHERE id = ANY(${ids}::uuid[])
    `
  },

  async bulkSetAppliedWatermarkPreset(ids: string[], presetId: string | null): Promise<void> {
    await prisma.photo.updateMany({
      where: { id: { in: ids } },
      data:  { appliedWatermarkPresetId: presetId },
    })
  },

  async bulkUpdateEditStatus(ids: string[], editStatus: import('@prisma/client').EditStatus): Promise<void> {
    await prisma.photo.updateMany({ where: { id: { in: ids } }, data: { editStatus } })
  },

  async updateProcessed(id: string, input: UpdateProcessedInput): Promise<void> {
    await prisma.photo.update({
      where: { id },
      data: {
        thumbnailKey:   input.thumbnailKey,
        previewKey:     input.previewKey,
        watermarkedKey: input.watermarkedKey,
        width:          input.width,
        height:         input.height,
        status:         input.status,
      },
    })
  },

  async findForDashboard(galleryId: string, params: PhotoListParams = {}) {
    const limit = Math.min(params.limit ?? 48, 96)
    const page  = Math.max(params.page  ?? 1,  1)

    const where: Prisma.PhotoWhereInput = { galleryId }

    if (params.q?.trim()) {
      where.filename = { contains: params.q.trim(), mode: 'insensitive' }
    }

    switch (params.status) {
      case 'processing':   where.status = { in: [PhotoStatus.UPLOADING, PhotoStatus.PROCESSING] }; break
      case 'ready':        where.status = PhotoStatus.READY; where.editStatus = EditStatus.NONE;   break
      case 'selected':     where.selectionItems = { some: {} };                                    break
      case 'editing':      where.editStatus = EditStatus.EDITING;                                  break
      case 'final_ready':  where.editStatus = EditStatus.FINAL_READY;                              break
      case 'failed':       where.status = PhotoStatus.FAILED;                                      break
    }

    if      (params.sectionId === 'none') where.sectionId = null
    else if (params.sectionId)            where.sectionId = params.sectionId

    if (params.clientSelected) where.selectionItems = { some: {} }
    if (params.hasComments)    where.comments        = { some: {} }
    if (params.hasFinal)       where.finalKey        = { not: null }
    if (params.labels?.length) where.labels          = { hasSome: params.labels }

    let orderBy: Prisma.PhotoOrderByWithRelationInput[]
    switch (params.sort) {
      case 'date_asc':      orderBy = [{ createdAt: 'asc' }];                                             break
      case 'filename':      orderBy = [{ filename: 'asc' }];                                              break
      case 'selected_first':orderBy = [{ selectionItems: { _count: 'desc' } }, { createdAt: 'desc' }];   break
      case 'final_first':   orderBy = [{ editStatus: 'desc' }, { createdAt: 'desc' }];                   break
      default:              orderBy = [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    }

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        orderBy,
        skip:   (page - 1) * limit,
        take:   limit,
        select: {
          id:             true,
          filename:       true,
          width:          true,
          height:         true,
          status:         true,
          editStatus:     true,
          sectionId:      true,
          thumbnailKey:   true,
          finalKey:                  true,
          labels:                    true,
          appliedWatermarkPresetId:  true,
          createdAt:                 true,
          _count: { select: { selectionItems: true, comments: true } },
        },
      }),
      prisma.photo.count({ where }),
    ])

    return { photos, total, page, limit }
  },

  async findDistinctLabels(galleryId: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ label: string }[]>`
      SELECT DISTINCT UNNEST(labels) AS label
      FROM "Photo"
      WHERE "galleryId" = ${galleryId}
      ORDER BY label
    `
    return rows.map((r) => r.label).filter(Boolean)
  },

  /**
   * Bulk-update sortOrder for a gallery's photos.
   * `orderedIds` is the full ordered array of photo IDs — index = desired sortOrder.
   * Only photos that belong to `galleryId` are updated (ownership safety).
   */
  async reorderPhotos(galleryId: string, orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return
    await prisma.$transaction(
      orderedIds.map((id, idx) =>
        prisma.photo.updateMany({
          where: { id, galleryId },
          data:  { sortOrder: idx },
        }),
      ),
    )
  },

  /** Batch-fetch thumbnailKey for a set of photo IDs. Returns a Map<photoId, thumbnailKey>. */
  async findThumbnailKeysByIds(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map()
    const rows = await prisma.photo.findMany({
      where:  { id: { in: ids }, status: 'READY', thumbnailKey: { not: null } },
      select: { id: true, thumbnailKey: true },
    })
    const result = new Map<string, string>()
    for (const r of rows) {
      if (r.thumbnailKey) result.set(r.id, r.thumbnailKey)
    }
    return result
  },
}
