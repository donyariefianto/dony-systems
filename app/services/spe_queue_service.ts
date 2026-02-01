import { Queue } from 'bullmq'
import env from '#start/env'

// Konfigurasi koneksi Redis untuk BullMQ
const connection = {
 host: env.get('REDIS_HOST'),
 port: env.get('REDIS_PORT'),
 password: env.get('REDIS_PASSWORD'),
}

export const SPE_QUEUE_NAME = 'spe_timeline_queue'

export const speQueue = new Queue(SPE_QUEUE_NAME, {
 connection,
 defaultJobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: true,
 },
})
