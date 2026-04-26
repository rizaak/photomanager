import JSZip from 'jszip'
import { DownloadStatus } from '@prisma/client'
import { PhotoRepository } from '../../photos/repositories/PhotoRepository'
import { SelectionRepository } from '../../selections/repositories/SelectionRepository'
import { DownloadRepository } from '../repositories/DownloadRepository'
import { storageProvider } from '../../../infrastructure/storage/StorageProvider'

export const ZipGenerationService = {
  async generate(downloadId: string, selectionId: string): Promise<void> {
    await DownloadRepository.updateStatus(downloadId, DownloadStatus.PROCESSING)

    // Get selected photo IDs
    const photoIds = await SelectionRepository.getPhotoIds(selectionId)
    if (photoIds.length === 0) {
      throw new Error('Selection is empty')
    }

    // Fetch only READY photos
    const photos = await PhotoRepository.findManyByIds(photoIds)
    if (photos.length === 0) {
      throw new Error('No ready photos in selection')
    }

    // Build ZIP — download originals sequentially to limit memory pressure
    const zip = new JSZip()

    for (const photo of photos) {
      const buffer = await storageProvider.download(photo.originalKey)
      zip.file(photo.filename, buffer)
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 1 }, // speed over size — originals are already compressed
    })

    const zipKey = `downloads/zips/${downloadId}.zip`
    await storageProvider.upload(zipKey, zipBuffer, 'application/zip')
    await DownloadRepository.updateReady(downloadId, zipKey)
  },
}
