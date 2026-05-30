import { initSentry, Sentry } from '../config/sentry'
import { notificationWorker } from "./jobs/notification.worker";
import { emailWorker } from "./jobs/email.worker";
import { billingWorker } from "./jobs/billing.worker";
import { instrumentWorkerWithMetrics } from "../utils/queue-metrics";
import { addToDLQ } from '../queues/dlq';
import { registerQueueMetricsHooks } from '../queues/queueMonitor';
import { notificationQueue, emailQueue, billingQueue } from '../queues/queue';

initSentry()

process.on('uncaughtException', function(err) {
  Sentry.captureException(err)
  console.error('[Worker] Uncaught Exception:', err)
  process.exit(1)
})
process.on('unhandledRejection', function(reason) {
  Sentry.captureException(reason)
})

console.log("🚀 GymPro workers started");

// Instrument workers with metrics
instrumentWorkerWithMetrics(notificationWorker, "notifications");
instrumentWorkerWithMetrics(emailWorker, "emails");
instrumentWorkerWithMetrics(billingWorker, "billing");

// Register queue metrics hooks (completed/failed/stalled counters)
registerQueueMetricsHooks(notificationQueue, notificationWorker);
registerQueueMetricsHooks(emailQueue, emailWorker);
registerQueueMetricsHooks(billingQueue, billingWorker);

notificationWorker.on("completed", (job) => {
  console.log(`✅ Notification job completed: ${job.id}`);
});

notificationWorker.on("failed", (job, error) => {
  console.error(`❌ Notification job failed: ${job?.id}`, error);
  Sentry.withScope(function(scope) {
    scope.setTag('queue', 'notifications')
    scope.setTag('jobName', (job && job.name) || 'unknown')
    scope.setContext('bullmqJob', { id: job && job.id, attemptsMade: job && job.attemptsMade })
    Sentry.captureException(error)
  })
});

notificationWorker.on('failed', async function(job, err) {
  const maxAttempts = (job && job.opts && job.opts.attempts) ? job.opts.attempts : 3
  if (job && job.attemptsMade >= maxAttempts) {
    await addToDLQ('notifications', job, err)
  }
});

emailWorker.on("completed", (job) => {
  console.log(`✅ Email job completed: ${job.id}`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`❌ Email job failed: ${job?.id}`, error);
  Sentry.withScope(function(scope) {
    scope.setTag('queue', 'emails')
    scope.setTag('jobName', (job && job.name) || 'unknown')
    scope.setContext('bullmqJob', { id: job && job.id, attemptsMade: job && job.attemptsMade })
    Sentry.captureException(error)
  })
});

emailWorker.on('failed', async function(job, err) {
  const maxAttempts = (job && job.opts && job.opts.attempts) ? job.opts.attempts : 3
  if (job && job.attemptsMade >= maxAttempts) {
    await addToDLQ('emails', job, err)
  }
});

billingWorker.on("completed", (job) => {
  console.log(`✅ Billing job completed: ${job.id}`);
});

billingWorker.on("failed", (job, error) => {
  console.error(`❌ Billing job failed: ${job?.id}`, error);
  Sentry.withScope(function(scope) {
    scope.setTag('queue', 'billing')
    scope.setTag('jobName', (job && job.name) || 'unknown')
    scope.setContext('bullmqJob', { id: job && job.id, attemptsMade: job && job.attemptsMade })
    Sentry.captureException(error)
  })
});

billingWorker.on('failed', async function(job, err) {
  const maxAttempts = (job && job.opts && job.opts.attempts) ? job.opts.attempts : 3
  if (job && job.attemptsMade >= maxAttempts) {
    await addToDLQ('billing', job, err)
  }
});

process.on("SIGINT", async () => {
  console.log("Shutting down workers...");

  await notificationWorker.close();
  await emailWorker.close();
  await billingWorker.close();

  process.exit(0);
});