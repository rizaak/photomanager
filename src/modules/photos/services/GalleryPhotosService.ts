import { storageProvider } from '../../../infrastructure/storage/StorageProvider'
import { PhotoRepository } from '../repositories/PhotoRepository'

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

async function signPhoto(photo: RawPhoto) {
  return {
    id:             photo.id,
    galleryId:      photo.galleryId,
    filename:       photo.filename,
    width:          photo.width  ?? 3,
    height:         photo.height ?? 2,
    thumbnailUrl:   await storageProvider.getSignedUrl(photo.thumbnailKey!,   URL_EXPIRY_SECONDS),
    watermarkedUrl: await storageProvider.getSignedUrl(photo.watermarkedKey!, URL_EXPIRY_SECONDS),
  }
}

export const GalleryPhotosService = {
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

    // Non-ready photos (uploading / processing / failed) — no signed URLs
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
}
