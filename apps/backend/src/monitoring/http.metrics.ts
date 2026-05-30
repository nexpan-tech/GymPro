import { client, registerMetric } from "./prometheus";

// HTTP request counter
export const httpRequestsTotal = new client.Counter({
  name: "gympro_http_requests_total",
  help: "Total HTTP requests received",
  labelNames: ["method", "route", "status"],
});
registerMetric(httpRequestsTotal);

// HTTP request duration histogram (in seconds)
export const httpRequestDurationSeconds = new client.Histogram({
  name: "gympro_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});
registerMetric(httpRequestDurationSeconds);

// HTTP requests in progress
export const httpRequestsInProgress = new client.Gauge({
  name: "gympro_http_requests_in_progress",
  help: "HTTP requests currently being processed",
  labelNames: ["method", "route"],
});
registerMetric(httpRequestsInProgress);

// HTTP request size (bytes)
export const httpRequestSize = new client.Histogram({
  name: "gympro_http_request_size_bytes",
  help: "HTTP request size in bytes",
  labelNames: ["method", "route"],
  buckets: [100, 1000, 10000, 100000, 1000000],
});
registerMetric(httpRequestSize);

// HTTP response size (bytes)
export const httpResponseSize = new client.Histogram({
  name: "gympro_http_response_size_bytes",
  help: "HTTP response size in bytes",
  labelNames: ["method", "route", "status"],
  buckets: [100, 1000, 10000, 100000, 1000000],
});
registerMetric(httpResponseSize);

// Requests by endpoint
export const httpRequestsByEndpoint = new client.Gauge({
  name: "gympro_http_requests_by_endpoint",
  help: "Total requests per endpoint",
  labelNames: ["method", "route"],
});
registerMetric(httpRequestsByEndpoint);

// Error rate by status code
export const httpErrorsTotal = new client.Counter({
  name: "gympro_http_errors_total",
  help: "Total HTTP errors by status code",
  labelNames: ["status"],
});
registerMetric(httpErrorsTotal);
