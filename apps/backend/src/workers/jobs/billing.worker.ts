import { Worker } from "bullmq";
import { redisConnection } from "../../queues/redis";
import { Sentry } from "../../config/sentry";

export const billingWorker = new Worker(
  "billing",
  async (job) => {
    console.log("Processing billing job:", job.id, job.data);

    return {
      success: true,
      processedAt: new Date().toISOString(),
    };
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    stalledInterval: 30000,
    maxStalledCount: 2,
  }
);

billingWorker.on('failed', function(job, error) {
  Sentry.withScope(function(scope) {
    scope.setTag('queue', 'billing')
    scope.setTag('jobName', (job && job.name) || 'unknown')
    scope.setContext('bullmqJob', { id: job && job.id, attemptsMade: job && job.attemptsMade })
    Sentry.captureException(error)
  })
})