import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { NotificationService } from '../modules/notifications/services/NotificationService'

export function startNotificationWorker() {
  const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  })

  const worker = new Worker(
    'notifications',
    async (job) => {
      const { type, payload } = job.data as { type: string; payload: Record<string, unknown> }
      console.log(`[notification-worker] processing: ${type}`)
      await NotificationService.process(type, payload)
    },
    { connection, concurrency: 5 },
  )

  worker.on('completed', (job) => {
    const { type } = job.data as { type: string }
    console.log(`[notification-worker] done: ${type} (job ${job.id})`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[notification-worker] failed — job ${job?.id}:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('[notification-worker] error:', err.message)
  })

  console.log('[notification-worker] started (concurrency: 5)')
  return worker
}
