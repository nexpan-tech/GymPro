import { incrementQueueJobCompleted, incrementQueueJobFailed } from '../middleware/metrics.middleware'
import { Worker, Queue } from 'bullmq'

export function registerQueueMetricsHooks(queue: Queue, worker: Worker): void {
  worker.on('completed', () => {
    incrementQueueJobCompleted(queue.name)
  })
  worker.on('failed', () => {
    incrementQueueJobFailed(queue.name)
  })
  worker.on('stalled', (jobId: string) => {
    console.warn('[Queue] Job stalled:', queue.name, jobId)
  })
}

export async function getQueueStats(queue: Queue) {
  const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed')
  return {
    name: queue.name,
    waiting: counts.waiting || 0,
    active: counts.active || 0,
    completed: counts.completed || 0,
    failed: counts.failed || 0,
    delayed: counts.delayed || 0,
  }
}

// Export an array of all known queue instances for health monitoring
// Import them from their respective queue files
export async function getAllQueueStats(queues: Queue[]) {
  const results = []
  for (const q of queues) {
    results.push(await getQueueStats(q))
  }
  return results
}
