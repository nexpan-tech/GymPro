// Core Prometheus setup
export { register as metricsRegistry, registerMetric, client } from "./prometheus";

// HTTP metrics
export {
  httpRequestsTotal as httpRequestCounter,
  httpRequestDurationSeconds,
  httpRequestsInProgress,
  httpRequestSize,
  httpResponseSize,
  httpRequestsByEndpoint,
  httpErrorsTotal,
} from "./http.metrics";

// Queue metrics
export {
  queueJobsCompleted,
  queueJobsFailed,
  queueJobsRetried,
  queueDepth,
  queueJobDurationSeconds,
  queueActiveJobs,
  queueStalledJobs,
  deadLetterQueueSize,
} from "./queue.metrics";

// Socket metrics
export {
  socketConnectionsActive,
  socketConnectionsTotal,
  socketDisconnectionsTotal,
  socketEventsEmitted,
  socketEventsReceived,
  socketRoomUsers,
  socketMessageSize,
  socketAuthFailures,
  socketLatency,
} from "./socket.metrics";

// System metrics
export {
  nodeMemoryUsage,
  eventLoopLag,
  redisConnectionStatus,
  redisOperationLatency,
  dbConnectionPoolSize,
  dbConnectionPoolWaiting,
  workerProcessHealth,
  uptime,
  cpuUsagePercent,
  initializeSystemMetrics,
} from "./system.metrics";