import { client, registerMetric } from "./prometheus";
import os from "os";

// Node.js memory usage (in bytes)
export const nodeMemoryUsage = new client.Gauge({
  name: "gympro_node_memory_usage_bytes",
  help: "Node.js process memory usage in bytes",
  labelNames: ["type"],
});
registerMetric(nodeMemoryUsage);

// Event loop lag (in milliseconds)
export const eventLoopLag = new client.Histogram({
  name: "gympro_event_loop_lag_ms",
  help: "Event loop lag in milliseconds",
  buckets: [1, 5, 10, 50, 100, 500, 1000],
});
registerMetric(eventLoopLag);

// Redis connection status
export const redisConnectionStatus = new client.Gauge({
  name: "gympro_redis_connection_status",
  help: "Redis connection status (1 = connected, 0 = disconnected)",
});
registerMetric(redisConnectionStatus);

// Redis operations latency
export const redisOperationLatency = new client.Histogram({
  name: "gympro_redis_operation_latency_ms",
  help: "Redis operation latency in milliseconds",
  labelNames: ["operation"],
  buckets: [1, 5, 10, 50, 100, 500, 1000],
});
registerMetric(redisOperationLatency);

// Database connection pool status
export const dbConnectionPoolSize = new client.Gauge({
  name: "gympro_db_connection_pool_size",
  help: "Database connection pool size",
});
registerMetric(dbConnectionPoolSize);

// Database connection pool waiting
export const dbConnectionPoolWaiting = new client.Gauge({
  name: "gympro_db_connection_pool_waiting",
  help: "Connections waiting for pool availability",
});
registerMetric(dbConnectionPoolWaiting);

// Worker process health
export const workerProcessHealth = new client.Gauge({
  name: "gympro_worker_process_health",
  help: "Worker process health status (1 = healthy, 0 = unhealthy)",
  labelNames: ["worker_id"],
});
registerMetric(workerProcessHealth);

// Uptime (in seconds)
export const uptime = new client.Gauge({
  name: "gympro_uptime_seconds",
  help: "Server uptime in seconds",
});
registerMetric(uptime);

// CPU usage percentage
export const cpuUsagePercent = new client.Gauge({
  name: "gympro_cpu_usage_percent",
  help: "CPU usage percentage",
});
registerMetric(cpuUsagePercent);

// Helper function to update memory metrics
export function updateMemoryMetrics() {
  const mem = process.memoryUsage();
  nodeMemoryUsage.set({ type: "heapUsed" }, mem.heapUsed);
  nodeMemoryUsage.set({ type: "heapTotal" }, mem.heapTotal);
  nodeMemoryUsage.set({ type: "external" }, mem.external);
  nodeMemoryUsage.set({ type: "rss" }, mem.rss);
}

// Helper function to update uptime metric
export function updateUptimeMetric() {
  uptime.set(process.uptime());
}

// Helper function to measure event loop lag
let lastCheck = Date.now();
export function measureEventLoopLag() {
  const now = Date.now();
  const lag = now - lastCheck - 1000; // 1 second interval check
  if (lag > 0) {
    eventLoopLag.observe(lag);
  }
  lastCheck = now;
}

// Initialize metrics update interval (every 10 seconds)
export function initializeSystemMetrics() {
  setInterval(() => {
    updateMemoryMetrics();
    updateUptimeMetric();
  }, 10000);

  // Measure event loop lag every second
  setInterval(measureEventLoopLag, 1000);
}
