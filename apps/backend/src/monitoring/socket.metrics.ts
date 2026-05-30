import { client, registerMetric } from "./prometheus";

// Active socket connections
export const socketConnectionsActive = new client.Gauge({
  name: "gympro_socket_connections_active",
  help: "Number of active WebSocket connections",
  labelNames: ["namespace"],
});
registerMetric(socketConnectionsActive);

// Total socket connections (lifetime)
export const socketConnectionsTotal = new client.Counter({
  name: "gympro_socket_connections_total",
  help: "Total WebSocket connections established",
  labelNames: ["namespace"],
});
registerMetric(socketConnectionsTotal);

// Socket disconnections
export const socketDisconnectionsTotal = new client.Counter({
  name: "gympro_socket_disconnections_total",
  help: "Total WebSocket disconnections",
  labelNames: ["namespace", "reason"],
});
registerMetric(socketDisconnectionsTotal);

// Events emitted
export const socketEventsEmitted = new client.Counter({
  name: "gympro_socket_events_emitted_total",
  help: "Total socket events emitted",
  labelNames: ["event_name", "namespace"],
});
registerMetric(socketEventsEmitted);

// Events received
export const socketEventsReceived = new client.Counter({
  name: "gympro_socket_events_received_total",
  help: "Total socket events received",
  labelNames: ["event_name", "namespace"],
});
registerMetric(socketEventsReceived);

// Socket rooms population
export const socketRoomUsers = new client.Gauge({
  name: "gympro_socket_room_users",
  help: "Number of users in a socket room",
  labelNames: ["room_name", "namespace"],
});
registerMetric(socketRoomUsers);

// Socket message size (bytes)
export const socketMessageSize = new client.Histogram({
  name: "gympro_socket_message_size_bytes",
  help: "Socket message size in bytes",
  labelNames: ["event_name"],
  buckets: [100, 1000, 10000, 100000, 1000000],
});
registerMetric(socketMessageSize);

// Socket authentication failures
export const socketAuthFailures = new client.Counter({
  name: "gympro_socket_auth_failures_total",
  help: "Total socket authentication failures",
  labelNames: ["reason"],
});
registerMetric(socketAuthFailures);

// Socket latency (handshake + first event)
export const socketLatency = new client.Histogram({
  name: "gympro_socket_latency_seconds",
  help: "Socket connection latency in seconds",
  labelNames: ["namespace"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
registerMetric(socketLatency);
