import sharp from 'sharp'
import { PhotoStatus } from '@prisma/client'
import { storageProvider } from '../../../infrastructure/storage/StorageProvider'
import { PhotoRepository } from '../repositories/PhotoRepository'
import { prisma } from '../../../infrastructure/database/db'

const THUMBNAIL_WIDTH = 400
const PREVIEW_WIDTH   = 1400
const WEBP_QUALITY    = 82

// ── SVG fallback watermark ────────────────────────────────────────────────────

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

// ── Custom watermark compositing ──────────────────────────────────────────────

function calcPosition(
  position: string,
  photoW: number, photoH: number,
  wmW: number, wmH: number,
): { top: number; left: number } {
  const pad = Math.round(Math.min(photoW, photoH) * 0.04)
  switch (position) {
    case 'TOP_LEFT':     return { top: pad, left: pad }
    case 'TOP_RIGHT':    return { top: pad, left: photoW - wmW - pad }
    case 'BOTTOM_LEFT':  return { top: photoH - wmH - pad, left: pad }
    case 'BOTTOM_RIGHT': return { top: photoH - wmH - pad, left: photoW - wmW - pad }
    default:             return {
      top:  Math.round((photoH - wmH) / 2),
      left: Math.round((photoW - wmW) / 2),
    }
  }
}

async function applyCustomWatermark(
  resizedBuffer: Buffer,
  photoW: number,
  photoH: number,
  wmImageKey: string,
  position: string,
  sizePct: number,
  opacity: number,
): Promise<Buffer> {
  const wmSource = await storageProvider.download(wmImageKey)

  // Resize watermark to sizePct% of the photo's width
  const targetW = Math.round(photoW * (sizePct / 100))
  const wmResized = await sharp(wmSource)
    .resize(targetW, null, { withoutEnlargement: false })
    .ensureAlpha()
    .png()
    .toBuffer()

  // Scale alpha channel pixel-by-pixel
  const { data, info } = await sharp(wmResized).raw().toBuffer({ resolveWithObject: true })
  const raw = Buffer.from(data)
  const factor = Math.max(0, Math.min(1, opacity / 100))
  for (let i = 3; i < raw.length; i += 4) {
    raw[i] = Math.round(raw[i] * factor)
  }
  const wmFinal = await sharp(raw, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer()

  const { width: wmW = targetW, height: wmH = 0 } = await sharp(wmFinal).metadata()
  const { top, left } = calcPosition(position, photoW, photoH, wmW, wmH)

  return sharp(resizedBuffer)
    .composite([{ input: wmFinal, top, left }])
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

// ── Main processing entry point ───────────────────────────────────────────────

export const ImageProcessingService = {
  /**
   * Regenerates only the watermarked preview for a single photo.
   * Uses the photo's `appliedWatermarkPresetId` if set, otherwise gallery preset, otherwise SVG.
   * Called by the `regen-watermark` BullMQ job.
   */
  async regenerateWatermark(photoId: string): Promise<void> {
    const photo = await PhotoRepository.findById(photoId)
    if (!photo) throw new Error(`Photo not found: ${photoId}`)
    if (!photo.previewKey) throw new Error(`Photo has no preview yet: ${photoId}`)

    const [gallery, photoPreset] = await Promise.all([
      prisma.gallery.findUnique({
        where:  { id: photo.galleryId },
        select: {
          watermarkEnabled:  true,
          watermarkPresetId: true,
          watermarkPreset:   { select: { imageKey: true, position: true, sizePct: true, opacity: true } },
        },
      }),
      photo.appliedWatermarkPresetId
        ? prisma.watermarkPreset.findUnique({
            where:  { id: photo.appliedWatermarkPresetId },
            select: { imageKey: true, position: true, sizePct: true, opacity: true },
          })
        : null,
    ])

    const original = await storageProvider.download(photo.originalKey)
    const resized  = await sharp(original)
      .resize(PREVIEW_WIDTH, null, { withoutEnlargement: true })
      .toBuffer()
    const { width: pw = PREVIEW_WIDTH, height: ph = 0 } = await sharp(resized).metadata()

    const wm = photoPreset ?? (gallery?.watermarkEnabled ? gallery.watermarkPreset : null)

    let watermarkedBuffer: Buffer
    if (wm) {
      watermarkedBuffer = await applyCustomWatermark(resized, pw, ph, wm.imageKey, wm.position, wm.sizePct, wm.opacity)
    } else if (gallery?.watermarkEnabled !== false && !photo.appliedWatermarkPresetId) {
      watermarkedBuffer = await sharp(resized)
        .composite([{ input: watermarkSvg(pw, ph), top: 0, left: 0 }])
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()
    } else {
      // Watermark explicitly removed or disabled — serve clean preview
      watermarkedBuffer = await sharp(resized).webp({ quality: WEBP_QUALITY }).toBuffer()
    }

    const watermarkedKey = `photos/watermarked/${photoId}.webp`
    await storageProvider.upload(watermarkedKey, watermarkedBuffer, 'image/webp')
    await PhotoRepository.updateWatermarkedKey(photoId, watermarkedKey)
  },

  async process(photoId: string): Promise<void> {
    const photo = await PhotoRepository.findById(photoId)
    if (!photo) throw new Error(`Photo not found: ${photoId}`)

    // Fetch gallery watermark settings + photo-level preset override
    const [gallery, photoPreset] = await Promise.all([
      prisma.gallery.findUnique({
        where:  { id: photo.galleryId },
        select: {
          watermarkEnabled:  true,
          watermarkPresetId: true,
          watermarkPreset:   {
            select: { imageKey: true, position: true, sizePct: true, opacity: true },
          },
        },
      }),
      photo.appliedWatermarkPresetId
        ? prisma.watermarkPreset.findUnique({
            where:  { id: photo.appliedWatermarkPresetId },
            select: { imageKey: true, position: true, sizePct: true, opacity: true },
          })
        : null,
    ])

    // ── Fetch original from R2 ────────────────────────────────────────────────
    const original = await storageProvider.download(photo.originalKey)

    // ── Dimensions ────────────────────────────────────────────────────────────
    const { width = 0, height = 0 } = await sharp(original).metadata()

    // ── Thumbnail ─────────────────────────────────────────────────────────────
    const thumbnailBuffer = await sharp(original)
      .resize(THUMBNAIL_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    // ── Clean preview ─────────────────────────────────────────────────────────
    const previewBuffer = await sharp(original)
      .resize(PREVIEW_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    // ── Watermarked preview ───────────────────────────────────────────────────
    const resized = await sharp(original)
      .resize(PREVIEW_WIDTH, null, { withoutEnlargement: true })
      .toBuffer()
    const { width: pw = PREVIEW_WIDTH, height: ph = 0 } = await sharp(resized).metadata()

    let watermarkedBuffer: Buffer

    // Photo-level override takes precedence; gallery-level fallback; SVG fallback
    const wm = gallery?.watermarkEnabled ? (photoPreset ?? gallery.watermarkPreset) : null

    if (wm) {
      // Custom watermark from preset
      watermarkedBuffer = await applyCustomWatermark(
        resized, pw, ph,
        wm.imageKey, wm.position, wm.sizePct, wm.opacity,
      )
    } else if (gallery?.watermarkEnabled !== false) {
      // SVG fallback (watermark enabled but no preset configured)
      watermarkedBuffer = await sharp(resized)
        .composite([{ input: watermarkSvg(pw, ph), top: 0, left: 0 }])
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()
    } else {
      // Watermark disabled — watermarked version equals clean preview
      watermarkedBuffer = previewBuffer
    }

    // ── Upload to R2 ──────────────────────────────────────────────────────────
    const thumbnailKey   = `photos/thumbnails/${photoId}.webp`
    const previewKey     = `photos/previews/${photoId}.webp`
    const watermarkedKey = `photos/watermarked/${photoId}.webp`

    await Promise.all([
      storageProvider.upload(thumbnailKey,   thumbnailBuffer,   'image/webp'),
      storageProvider.upload(previewKey,     previewBuffer,     'image/webp'),
      storageProvider.upload(watermarkedKey, watermarkedBuffer, 'image/webp'),
    ])

    // ── Persist keys, dimensions, and READY status ────────────────────────────
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
