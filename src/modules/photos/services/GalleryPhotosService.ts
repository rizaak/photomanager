import { storageProvider } from '../../../infrastructure/storage/StorageProvider'
import { PhotoRepository, type PhotoListParams } from '../repositories/PhotoRepository'

const URL_EXPIRY_SECONDS = 3600

type RawPhoto = {
  id: string
  galleryId: string
  filename: string
  width: number | null
  height: number | null
  thumbnailKey: string | null
  watermarkedKey: string | null
}

// Public-facing photo signing.
// watermarkEnabled=true (default) → serve watermarkedKey (may contain baked-in watermark).
// watermarkEnabled=false → serve thumbnailKey (clean, resized, never the original).
// Both keys are guaranteed non-null for READY photos by findGalleryWithReadyPhotos.
async function signPhoto(photo: RawPhoto, watermarkEnabled = true) {
  const key = watermarkEnabled ? photo.watermarkedKey! : (photo.thumbnailKey ?? photo.watermarkedKey!)
  const url = await storageProvider.getSignedUrl(key, URL_EXPIRY_SECONDS)
  return {
    id:             photo.id,
    galleryId:      photo.galleryId,
    filename:       photo.filename,
    width:          photo.width  ?? 3,
    height:         photo.height ?? 2,
    thumbnailUrl:   url,
    watermarkedUrl: url,
  }
}

export const GalleryPhotosService = {
  // ── Full gallery load (used by client gallery view + cover photo selector) ──
  async getForGallery(galleryId: string, opts: { publicOnly?: boolean } = {}) {
    const [result, nonReady] = await Promise.all([
      PhotoRepository.findGalleryWithReadyPhotos(galleryId, opts),
      PhotoRepository.findNonReadyByGallery(galleryId),
    ])
    if (!result) return null

    const sections = await Promise.all(
      result.sections.map(async (s) => ({
        id:        s.id,
        title:     s.title,
        sortOrder: s.sortOrder,
        photos:    await Promise.all(s.photos.map((p) => signPhoto(p, s.watermarkEnabled))),
      })),
    )

    const unsectioned = await Promise.all(result.photos.map((p) => signPhoto(p)))

    const pending = nonReady.map((p) => ({
      id:        p.id,
      galleryId: p.galleryId,
      filename:  p.filename,
      status:    p.status as 'UPLOADING' | 'PROCESSING' | 'FAILED',
      sectionId: p.sectionId,
    }))

    return {
      gallery:    { id: result.id, title: result.title },
      sections,
      unsectioned,
      pending,
    }
  },

  // ── Paginated + filtered load for photographer dashboard ──────────────────
  async listForDashboard(galleryId: string, params: PhotoListParams = {}) {
    const [result, allLabels] = await Promise.all([
      PhotoRepository.findForDashboard(galleryId, params),
      // Only fetch labels when not already filtering by them (for filter UI)
      params.labels?.length ? Promise.resolve([]) : PhotoRepository.findDistinctLabels(galleryId),
    ])

    const photos = await Promise.all(
      result.photos.map(async (p) => ({
        id:               p.id,
        filename:         p.filename,
        width:            p.width  ?? 3,
        height:           p.height ?? 2,
        sectionId:        p.sectionId,
        thumbnailUrl:     p.thumbnailKey
                            ? await storageProvider.getSignedUrl(p.thumbnailKey, URL_EXPIRY_SECONDS)
                            : null,
        status:           p.status === 'FAILED'
                            ? 'failed'
                            : p.status === 'READY'
                              ? 'ready'
                              : 'processing',
        editStatus:       p.editStatus as string,
        hasComments:      p._count.comments > 0,
        hasFavorites:     p._count.favorites > 0,
        hasFinal:                  !!p.finalKey,
        labels:                    p.labels,
        appliedWatermarkPresetId:  p.appliedWatermarkPresetId ?? null,
      })),
    )

    return {
      photos,
      total:    result.total,
      page:     result.page,
      pageSize: result.limit,
      hasMore:  result.page * result.limit < result.total,
      allLabels,
    }
  },
}
