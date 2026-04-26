import { Worker } from 'bullmq'
import Redis from 'ioredis'

export function startNotificationWorker() {
  const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  })

  const worker = new Worker(
    'notifications',
    async (job) => {
      const { type, payload } = job.data as { type: string; payload: Record<string, unknown> }
      // Placeholder — real email provider (e.g. Resend) wired in later
      console.log(`[notification-worker] ${type}`, JSON.stringify(payload))
    },
    { connection, concurrency: 5 },
  )

  worker.on('failed', (job, err) => {
    console.error(`[notification-worker] failed — job ${job?.id}:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('[notification-worker] error:', err.message)
  })

  console.log('[notification-worker] notifications worker started (concurrency: 5)')
  return worker
}
