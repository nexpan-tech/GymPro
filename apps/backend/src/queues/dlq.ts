import { Queue } from 'bullmq'
import { redisConnection } from './redis'

export const deadLetterQueue = new Queue('dead-letter', { connection: redisConnection })

export async function addToDLQ(originalQueue: string, job: any, error: Error) {
  try {
    await deadLetterQueue.add('failed-job', {
      originalQueue: originalQueue,
      originalJobId: job.id,
      originalJobName: job.name,
      originalJobData: job.data,
      errorMessage: error.message,
      errorStack: error.stack,
      attemptsMade: job.attemptsMade,
    })
  } catch (dlqError) {
    console.error('[DLQ] Failed to enqueue to dead letter queue', dlqError)
  }
}
