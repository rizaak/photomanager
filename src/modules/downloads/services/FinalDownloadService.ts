import { storageProvider } from '../../../infrastructure/storage/StorageProvider'
import { prisma } from '../../../infrastructure/database/db'
import { ClientRepository } from '../../clients/repositories/ClientRepository'
import { ActivityService } from '../../activity/services/ActivityService'

// Signed URL validity — 15 minutes per file (enough for browser to initiate download)
const FINAL_URL_EXPIRY_S = 900

const ANON_EMAIL = 'anonymous@gallery.local'

const TYPES_ALLOWING_FINALS = new Set(['FINAL_EDITED', 'SELECTED_ONLY', 'FULL_GALLERY'])

export interface FinalDownloadItem {
  photoId:  string
  filename: string
  url:      string
}

export const FinalDownloadService = {
  async getFinalDownloads(
    galleryId:   string,
    clientToken?: string,
  ): Promise<FinalDownloadItem[]> {
    // 1. Check gallery download permissions
    const gallery = await prisma.gallery.findUnique({
      where:  { id: galleryId },
      select: { downloadEnabled: true, downloadType: true, allowSelection: true },
    })
    if (!gallery) throw Object.assign(new Error('Gallery not found'), { status: 404 })
    if (!gallery.downloadEnabled) {
      throw Object.assign(new Error('Downloads are not enabled for this gallery'), { status: 403 })
    }
    if (!TYPES_ALLOWING_FINALS.has(gallery.downloadType)) {
      throw Object.assign(new Error('Final downloads are not available for this gallery'), { status: 403 })
    }

    // 2. Resolve client identity
    const clientEmail = clientToken
      ? ((await ClientRepository.findByToken(clientToken))?.email ?? ANON_EMAIL)
      : ANON_EMAIL

    // 3. Find the client's submitted selection
    const selection = await prisma.selection.findFirst({
      where:   { galleryId, clientEmail, submittedAt: { not: null } },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        items: {
          select: {
            photo: {
              select: {
                id:        true,
                filename:  true,
                finalKey:  true,
                editStatus: true,
              },
            },
          },
        },
      },
    })

    if (!selection) {
      throw Object.assign(new Error('No submitted selection found'), { status: 404 })
    }

    // 4. Filter to photos that have a final uploaded
    const finalPhotos = selection.items
      .map((i) => i.photo)
      .filter((p) => p.finalKey && p.editStatus === 'FINAL_READY')

    if (finalPhotos.length === 0) {
      throw Object.assign(new Error('No final photos are ready for download yet'), { status: 404 })
    }

    // 5. Generate signed URLs — never expose raw keys
    const items: FinalDownloadItem[] = await Promise.all(
      finalPhotos.map(async (p) => ({
        photoId:  p.id,
        filename: p.filename,
        url:      await storageProvider.getSignedUrl(p.finalKey!, FINAL_URL_EXPIRY_S, p.filename),
      })),
    )

    // 6. Log activity (fire-and-forget)
    ActivityService.log(galleryId, 'DOWNLOAD_REQUESTED', { type: 'finals', count: items.length })

    return items
  },
}
