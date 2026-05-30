import { client, registerMetric } from "./prometheus";

// Queue jobs completed
export const queueJobsCompleted = new client.Counter({
  name: "gympro_queue_jobs_completed_total",
  help: "Total jobs completed by queue",
  labelNames: ["queue_name"],
});
registerMetric(queueJobsCompleted);

// Queue jobs failed
export const queueJobsFailed = new client.Counter({
  name: "gympro_queue_jobs_failed_total",
  help: "Total jobs failed by queue",
  labelNames: ["queue_name", "error_type"],
});
registerMetric(queueJobsFailed);

// Queue jobs retried
export const queueJobsRetried = new client.Counter({
  name: "gympro_queue_jobs_retried_total",
  help: "Total jobs retried by queue",
  labelNames: ["queue_name"],
});
registerMetric(queueJobsRetried);

// Queue depth (pending jobs)
export const queueDepth = new client.Gauge({
  name: "gympro_queue_depth",
  help: "Current number of pending jobs in queue",
  labelNames: ["queue_name"],
});
registerMetric(queueDepth);

// Queue job processing time (in seconds)
export const queueJobDurationSeconds = new client.Histogram({
  name: "gympro_queue_job_duration_seconds",
  help: "Job processing duration in seconds",
  labelNames: ["queue_name"],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300],
});
registerMetric(queueJobDurationSeconds);

// Queue active jobs (jobs being processed)
export const queueActiveJobs = new client.Gauge({
  name: "gympro_queue_active_jobs",
  help: "Number of jobs currently being processed",
  labelNames: ["queue_name"],
});
registerMetric(queueActiveJobs);

// Queue stalled jobs (jobs stuck in processing)
export const queueStalledJobs = new client.Gauge({
  name: "gympro_queue_stalled_jobs",
  help: "Number of stalled jobs waiting to be processed",
  labelNames: ["queue_name"],
});
registerMetric(queueStalledJobs);

// Dead letter queue size
export const deadLetterQueueSize = new client.Gauge({
  name: "gympro_dead_letter_queue_size",
  help: "Number of failed jobs in dead letter queue",
  labelNames: ["queue_name"],
});
registerMetric(deadLetterQueueSize);
