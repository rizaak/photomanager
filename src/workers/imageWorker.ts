import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { PhotoStatus } from '@prisma/client'
import { ImageProcessingService } from '../modules/photos/services/ImageProcessingService'
import { PhotoRepository } from '../modules/photos/repositories/PhotoRepository'

export function startImageWorker() {
  const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  })

  const worker = new Worker(
    'image-processing',
    async (job) => {
      const { photoId } = job.data as { photoId: string; galleryId?: string; presetId?: string | null }
      if (job.name === 'regen-watermark') {
        console.log(`[worker] regen-watermark photo ${photoId} (job ${job.id})`)
        await ImageProcessingService.regenerateWatermark(photoId)
      } else {
        console.log(`[worker] processing photo ${photoId} (job ${job.id})`)
        await ImageProcessingService.process(photoId)
      }
    },
    { connection, concurrency: 2 },
  )

  worker.on('completed', (job) => {
    console.log(`[worker] done — photo ${job.data.photoId}`)
  })

  // Mark FAILED only after all BullMQ retry attempts are exhausted
  worker.on('failed', async (job, err) => {
    console.error(`[worker] failed — job ${job?.id}:`, err.message)
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await PhotoRepository.updateStatus(job.data.photoId, PhotoStatus.FAILED)
    }
  })

  worker.on('error', (err) => {
    console.error('[worker] error:', err.message)
  })

  console.log('[worker] image-processing worker started (concurrency: 2)')
  return worker
}
