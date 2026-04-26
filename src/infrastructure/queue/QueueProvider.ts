import { Queue } from 'bullmq'
import Redis from 'ioredis'

declare global {
  // eslint-disable-next-line no-var
  var __redisConn: Redis | undefined
  // eslint-disable-next-line no-var
  var __imageQueue: Queue | undefined
  // eslint-disable-next-line no-var
  var __zipQueue: Queue | undefined
  // eslint-disable-next-line no-var
  var __notificationQueue: Queue | undefined
}

function getConnection(): Redis {
  if (!globalThis.__redisConn) {
    globalThis.__redisConn = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    })
  }
  return globalThis.__redisConn
}

function getImageQueue(): Queue {
  if (!globalThis.__imageQueue) {
    globalThis.__imageQueue = new Queue('image-processing', {
      connection: getConnection(),
    })
  }
  return globalThis.__imageQueue
}

function getZipQueue(): Queue {
  if (!globalThis.__zipQueue) {
    globalThis.__zipQueue = new Queue('zip-generation', {
      connection: getConnection(),
    })
  }
  return globalThis.__zipQueue
}

function getNotificationQueue(): Queue {
  if (!globalThis.__notificationQueue) {
    globalThis.__notificationQueue = new Queue('notifications', {
      connection: getConnection(),
    })
  }
  return globalThis.__notificationQueue
}

export const QueueProvider = {
  async enqueueImageProcessing(photoId: string, galleryId: string): Promise<void> {
    await getImageQueue().add(
      'process-image',
      { photoId, galleryId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    )
  },

  async enqueueZipGeneration(downloadId: string, selectionId: string): Promise<void> {
    await getZipQueue().add(
      'generate-zip',
      { downloadId, selectionId },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
      },
    )
  },

  async enqueueNotification(type: string, payload: Record<string, unknown>): Promise<void> {
    await getNotificationQueue().add(
      'notify',
      { type, payload },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
      },
    )
  },
}
