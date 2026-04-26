import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { DownloadStatus } from '@prisma/client'
import { ZipGenerationService } from '../modules/downloads/services/ZipGenerationService'
import { DownloadRepository } from '../modules/downloads/repositories/DownloadRepository'

export function startZipWorker() {
  const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  })

  const worker = new Worker(
    'zip-generation',
    async (job) => {
      const { downloadId, selectionId } = job.data as { downloadId: string; selectionId: string }
      console.log(`[zip-worker] generating ZIP for download ${downloadId} (job ${job.id})`)
      await ZipGenerationService.generate(downloadId, selectionId)
    },
    { connection, concurrency: 1 },
  )

  worker.on('completed', (job) => {
    console.log(`[zip-worker] done — download ${job.data.downloadId}`)
  })

  worker.on('failed', async (job, err) => {
    console.error(`[zip-worker] failed — job ${job?.id}:`, err.message)
    if (job && job.attemptsMade >= (job.opts.attempts ?? 2)) {
      await DownloadRepository.updateStatus(job.data.downloadId, DownloadStatus.FAILED)
    }
  })

  worker.on('error', (err) => {
    console.error('[zip-worker] error:', err.message)
  })

  console.log('[zip-worker] zip-generation worker started (concurrency: 1)')
  return worker
}
