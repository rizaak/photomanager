import { GalleryRepository, type CreateGalleryInput } from '../repositories/GalleryRepository'
import { UsageService } from '../../photographers/services/UsageService'

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
  async listGalleries(photographerId: string) {
    const rows = await GalleryRepository.findAllForPhotographer(photographerId)

    return rows.map((g) => ({
      id:              g.id,
      shareToken:      g.shareToken,
      title:           g.title,
      clientName:      g.clientName,
      status:          STATUS_MAP[g.status],
      clientActivity:  ACTIVITY_MAP[g.clientActivity],
      downloadEnabled: g.downloadEnabled,
      coverColor:      deriveCoverColor(g.id),
      photoCount:      g._count.photos,
      selectedCount:   g.selections[0]?._count.items ?? 0,
      createdAt:       g.createdAt.toISOString().split('T')[0],
      expiresAt:       g.expiresAt?.toISOString().split('T')[0] ?? undefined,
    }))
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
    await UsageService.checkGalleryLimit(photographerId)
    return GalleryRepository.create(photographerId, data)
  },
}
