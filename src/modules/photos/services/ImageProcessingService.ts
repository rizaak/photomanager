import sharp from 'sharp'
import { PhotoStatus } from '@prisma/client'
import { storageProvider } from '../../../infrastructure/storage/StorageProvider'
import { PhotoRepository } from '../repositories/PhotoRepository'

const THUMBNAIL_WIDTH = 400
const PREVIEW_WIDTH   = 1400
const WEBP_QUALITY    = 82

function watermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.round(Math.min(width, height) * 0.12)
  const spacing  = Math.round(fontSize * 0.3)
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="50%" y="50%"
        dominant-baseline="middle" text-anchor="middle"
        transform="rotate(-30, ${width / 2}, ${height / 2})"
        font-family="serif" font-size="${fontSize}" letter-spacing="${spacing}"
        fill="white" opacity="0.12"
      >FRAME</text>
    </svg>`,
  )
}

export const ImageProcessingService = {
  async process(photoId: string): Promise<void> {
    const photo = await PhotoRepository.findById(photoId)
    if (!photo) throw new Error(`Photo not found: ${photoId}`)

    // ── Fetch original from R2 ────────────────────────────────────────────
    const original = await storageProvider.download(photo.originalKey)

    // ── Dimensions from metadata ──────────────────────────────────────────
    const { width = 0, height = 0 } = await sharp(original).metadata()

    // ── Thumbnail ─────────────────────────────────────────────────────────
    const thumbnailBuffer = await sharp(original)
      .resize(THUMBNAIL_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    // ── Preview (clean, no watermark) ─────────────────────────────────────
    const previewBuffer = await sharp(original)
      .resize(PREVIEW_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    // ── Watermarked preview ───────────────────────────────────────────────
    // Resize once, composite SVG watermark, re-encode
    const resized = await sharp(original)
      .resize(PREVIEW_WIDTH, null, { withoutEnlargement: true })
      .toBuffer()

    const { width: pw = PREVIEW_WIDTH, height: ph = 0 } = await sharp(resized).metadata()

    const watermarkedBuffer = await sharp(resized)
      .composite([{ input: watermarkSvg(pw, ph), top: 0, left: 0 }])
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    // ── Upload all three to R2 in parallel ────────────────────────────────
    const thumbnailKey   = `photos/thumbnails/${photoId}.webp`
    const previewKey     = `photos/previews/${photoId}.webp`
    const watermarkedKey = `photos/watermarked/${photoId}.webp`

    await Promise.all([
      storageProvider.upload(thumbnailKey,   thumbnailBuffer,   'image/webp'),
      storageProvider.upload(previewKey,     previewBuffer,     'image/webp'),
      storageProvider.upload(watermarkedKey, watermarkedBuffer, 'image/webp'),
    ])

    // ── Persist keys, dimensions, and READY status ────────────────────────
    await PhotoRepository.updateProcessed(photoId, {
      thumbnailKey,
      previewKey,
      watermarkedKey,
      width,
      height,
      status: PhotoStatus.READY,
    })
  },
}
