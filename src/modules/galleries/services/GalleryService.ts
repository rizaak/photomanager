import { GalleryRepository, type CreateGalleryInput, type GalleryListParams } from '../repositories/GalleryRepository'
import { UsageService } from '../../photographers/services/UsageService'
import { PhotoRepository } from '../../photos/repositories/PhotoRepository'
import { storageProvider } from '../../../infrastructure/storage/StorageProvider'
import { Prisma } from '@prisma/client'

const COVER_URL_EXPIRY = 3600 // 1 hour
const PAGE_SIZE        = 24

export interface GalleryListQuery {
  search?:           string
  status?:           string   // 'draft' | 'active' | 'archived' | 'delivered' | 'expired'
  downloadEnabled?:  string   // 'true' | 'false'
  hasSelections?:    string   // 'true'
  tags?:             string   // comma-separated
  folder?:           string   // folder id | 'none'
  sort?:             string   // 'newest' | 'oldest' | 'name' | 'active' | 'selected'
  page?:             string   // '1', '2', ...
}

// ── Enum → frontend string maps ────────────────────────────────────────────
const STATUS_MAP = {
  DRAFT:    'draft',
  ACTIVE:   'active',
  ARCHIVED: 'archived',
} as const

const ACTIVITY_MAP = {
  NOT_OPENED: 'not_opened',
  SELECTING:  'selecting',
  SUBMITTED:  'submitted',
} as const

// ── Deterministic cover color from gallery id ─────────────────────────────
const COVER_COLORS = [
  'bg-stone-200', 'bg-stone-300', 'bg-stone-400',
  'bg-stone-500', 'bg-stone-600', 'bg-stone-700',
]
function deriveCoverColor(id: string): string {
  let h = 0
  for (const c of id) h = ((h * 31) + c.charCodeAt(0)) >>> 0
  return COVER_COLORS[h % COVER_COLORS.length]
}

export const GalleryService = {
  // ── List ───────────────────────────────────────────────────────────────────
  async listGalleries(photographerId: string, query: GalleryListQuery = {}) {
    const page     = Math.max(1, parseInt(query.page ?? '1') || 1)
    const pageSize = PAGE_SIZE

    // ── Sort mapping ────────────────────────────────────────────────────────
    const sort    = query.sort ?? 'newest'
    // "selected" sort is done in JS after fetch (can't order by nested count in Prisma)
    const sortInJs = sort === 'selected'
    const orderBy: Prisma.GalleryOrderByWithRelationInput[] =
      sort === 'oldest'  ? [{ createdAt: 'asc' }]  :
      sort === 'name'    ? [{ title:     'asc' }]   :
      sort === 'active'  ? [{ updatedAt: 'desc' }]  :
      /* newest / selected */ [{ createdAt: 'desc' }]

    // ── Status filter mapping ───────────────────────────────────────────────
    const repoParams: GalleryListParams = { orderBy }

    if (query.search?.trim())        repoParams.search = query.search.trim()
    if (query.downloadEnabled === 'true')  repoParams.downloadEnabled = true
    if (query.downloadEnabled === 'false') repoParams.downloadEnabled = false
    if (query.hasSelections === 'true')    repoParams.hasSubmittedSelection = true
    if (query.tags) {
      const tagList = query.tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (tagList.length > 0) repoParams.tags = tagList
    }
    if (query.folder) repoParams.folderId = query.folder

    if (query.status) {
      if (query.status === 'draft')     repoParams.status = 'DRAFT'
      else if (query.status === 'active')   repoParams.status = 'ACTIVE'
      else if (query.status === 'archived') repoParams.status = 'ARCHIVED'
      else if (query.status === 'delivered') {
        repoParams.status          = 'ACTIVE'
        repoParams.downloadEnabled = true
      }
      // 'expired' handled below after fetching
    }

    // For JS-sorted queries we must fetch all, then paginate in memory
    if (!sortInJs && query.status !== 'expired') {
      repoParams.skip = (page - 1) * pageSize
      repoParams.take = pageSize
    }

    const { rows, total: rawTotal } = await GalleryRepository.findAllForPhotographer(photographerId, repoParams)

    // Post-fetch filtering / sorting
    let filtered = rows

    if (query.status === 'expired') {
      const now = new Date()
      filtered = filtered.filter((g) => g.expiresAt && g.expiresAt < now)
    }

    if (sortInJs) {
      filtered = [...filtered].sort((a, b) => {
        const aCount = a.selections[0]?._count.items ?? 0
        const bCount = b.selections[0]?._count.items ?? 0
        return bCount - aCount
      })
    }

    // Determine real total and apply pagination in memory when needed
    const total = (query.status === 'expired' || sortInJs) ? filtered.length : rawTotal
    const page_rows = (query.status === 'expired' || sortInJs)
      ? filtered.slice((page - 1) * pageSize, page * pageSize)
      : filtered

    // ── Resolve cover thumbnail keys ────────────────────────────────────────
    const firstPhotoMap = new Map<string, string>()
    const extraPhotoIds = new Set<string>()

    for (const g of page_rows) {
      if (g.photos[0]?.thumbnailKey) {
        firstPhotoMap.set(g.id, g.photos[0].thumbnailKey)
      }
      if (g.coverPhotoId && g.photos[0]?.id !== g.coverPhotoId) {
        extraPhotoIds.add(g.coverPhotoId)
      }
    }

    const extraKeyMap = await PhotoRepository.findThumbnailKeysByIds([...extraPhotoIds])

    const keySet = new Set<string>()
    for (const g of page_rows) {
      const key = g.coverPhotoId
        ? (extraKeyMap.get(g.coverPhotoId) ?? firstPhotoMap.get(g.id))
        : firstPhotoMap.get(g.id)
      if (key) keySet.add(key)
    }

    const signedMap = new Map<string, string>()
    await Promise.all(
      [...keySet].map(async (key) => {
        const url = await storageProvider.getSignedUrl(key, COVER_URL_EXPIRY)
        signedMap.set(key, url)
      }),
    )

    const galleries = page_rows.map((g) => {
      const thumbnailKey = g.coverPhotoId
        ? (extraKeyMap.get(g.coverPhotoId) ?? firstPhotoMap.get(g.id))
        : firstPhotoMap.get(g.id)

      return {
        id:              g.id,
        folderId:        g.folderId ?? undefined,
        shareToken:      g.shareToken,
        title:           g.title,
        clientName:      g.clientName,
        status:          STATUS_MAP[g.status],
        clientActivity:  ACTIVITY_MAP[g.clientActivity],
        downloadEnabled: g.downloadEnabled,
        coverColor:      deriveCoverColor(g.id),
        coverPhotoUrl:   thumbnailKey ? signedMap.get(thumbnailKey) : undefined,
        photoCount:      g._count.photos,
        selectedCount:   g.selections[0]?._count.items ?? 0,
        createdAt:       g.createdAt.toISOString().split('T')[0],
        expiresAt:       g.expiresAt?.toISOString().split('T')[0] ?? undefined,
        tags:            g.tags,
      }
    })

    return {
      galleries,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    }
  },

  // ── Distinct tags for filter UI ───────────────────────────────────────────
  async getDistinctTags(photographerId: string): Promise<string[]> {
    return GalleryRepository.findDistinctTags(photographerId)
  },

  // ── Detail (photographer dashboard) ───────────────────────────────────────
  async getDetail(galleryId: string, photographerId: string) {
    const gallery = await GalleryRepository.findDetail(galleryId)
    if (!gallery) return null
    if (gallery.photographerId !== photographerId) return null // ownership guard

    const sel = gallery.selections[0] ?? null

    return {
      id:              gallery.id,
      shareToken:      gallery.shareToken,
      title:           gallery.title,
      clientName:      gallery.clientName,
      status:          STATUS_MAP[gallery.status],
      clientActivity:  ACTIVITY_MAP[gallery.clientActivity],
      downloadEnabled: gallery.downloadEnabled,
      photoCount:      gallery._count.photos,
      selection: sel
        ? {
            id:            sel.id,
            photoCount:    sel._count.items,
            submittedAt:   sel.submittedAt?.toISOString() ?? null,
            workflowState: sel.workflowState as string,
          }
        : null,
    }
  },

  // ── Resolve share token (public, used by client gallery page) ─────────────
  async findByShareToken(token: string) {
    const gallery = await GalleryRepository.findByShareToken(token)
    if (!gallery) return null
    return { id: gallery.id }
  },

  // ── Create ─────────────────────────────────────────────────────────────────
  async createGallery(data: CreateGalleryInput, photographerId: string) {
    return GalleryRepository.create(photographerId, data)
  },

  // ── Delete ─────────────────────────────────────────────────────────────────
  async deleteGallery(galleryId: string, photographerId: string) {
    const gallery = await GalleryRepository.findDetail(galleryId)
    if (!gallery) throw Object.assign(new Error('Not found'), { status: 404 })
    if (gallery.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })
    await GalleryRepository.delete(galleryId)
  },

  // ── Duplicate ──────────────────────────────────────────────────────────────
  async duplicateGallery(galleryId: string, photographerId: string) {
    const source = await GalleryRepository.findForDuplicate(galleryId)
    if (!source) throw Object.assign(new Error('Not found'), { status: 404 })
    if (source.photographerId !== photographerId) throw Object.assign(new Error('Forbidden'), { status: 403 })
    return GalleryRepository.duplicate(photographerId, source)
  },
}
