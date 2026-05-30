import { Worker, Job } from "bullmq";
import {
  queueJobsCompleted,
  queueJobsFailed,
  queueJobDurationSeconds,
  queueActiveJobs,
} from "../monitoring/queue.metrics";

/**
 * Instrument a worker with metrics tracking
 */
export function instrumentWorkerWithMetrics(
  worker: Worker,
  queueName: string
) {
  // Track completed jobs
  worker.on("completed", (job: Job) => {
    queueJobsCompleted.inc({ queue_name: queueName });
    const duration = job.finishedOn && job.processedOn
      ? (job.finishedOn - job.processedOn) / 1000
      : 0;
    if (duration > 0) {
      queueJobDurationSeconds.observe({ queue_name: queueName }, duration);
    }
  });

  // Track failed jobs
  worker.on("failed", (job: Job | undefined, error: Error) => {
    const errorType = error?.name || "Unknown";
    queueJobsFailed.inc({ queue_name: queueName, error_type: errorType });
  });

  // Track active jobs
  worker.on("active", () => {
    queueActiveJobs.inc({ queue_name: queueName });
  });

  // Decrement active jobs on completion
  worker.on("completed", () => {
    queueActiveJobs.dec({ queue_name: queueName });
  });

  // Decrement active jobs on failure
  worker.on("failed", () => {
    queueActiveJobs.dec({ queue_name: queueName });
  });
}
