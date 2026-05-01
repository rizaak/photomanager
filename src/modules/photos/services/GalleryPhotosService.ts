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

// Public-facing: both grid and modal always serve watermarked URLs.
// The DB query (findGalleryWithReadyPhotos) already requires watermarkedKey NOT NULL,
// so the assertion is safe. When watermark is disabled the worker still writes the
// clean preview to watermarkedKey — so this is correct in both cases.
async function signPhoto(photo: RawPhoto) {
  const watermarkedUrl = await storageProvider.getSignedUrl(photo.watermarkedKey!, URL_EXPIRY_SECONDS)
  return {
    id:             photo.id,
    galleryId:      photo.galleryId,
    filename:       photo.filename,
    width:          photo.width  ?? 3,
    height:         photo.height ?? 2,
    // thumbnailUrl intentionally points to watermarked asset — the grid must
    // never serve the clean thumbnail to public clients.
    thumbnailUrl:   watermarkedUrl,
    watermarkedUrl,
  }
}

export const GalleryPhotosService = {
  // ── Full gallery load (used by client gallery view + cover photo selector) ──
  async getForGallery(galleryId: string) {
    const [result, nonReady] = await Promise.all([
      PhotoRepository.findGalleryWithReadyPhotos(galleryId),
      PhotoRepository.findNonReadyByGallery(galleryId),
    ])
    if (!result) return null

    const sections = await Promise.all(
      result.sections.map(async (s) => ({
        id:        s.id,
        title:     s.title,
        sortOrder: s.sortOrder,
        photos:    await Promise.all(s.photos.map(signPhoto)),
      })),
    )

    const unsectioned = await Promise.all(result.photos.map(signPhoto))

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
        isClientSelected: p._count.selectionItems > 0,
        hasComments:      p._count.comments > 0,
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
