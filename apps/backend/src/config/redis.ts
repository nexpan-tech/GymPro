import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://redis:6379";

export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 200, 10000),
  lazyConnect: false,
  enableReadyCheck: true,
});

redisClient.on("connect", () => {
  console.log("[Redis] Connection established");
});

redisClient.on("ready", () => {
  console.log("[Redis] Client ready");
});

redisClient.on("error", (err: Error) => {
  console.error("[Redis] Client error:", err);
});

redisClient.on("close", () => {
  console.warn("[Redis] Connection closed");
});

export function createRedisConnection(): Redis {
  const conn = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });
  conn.on("error", (err: Error) => console.error("[Redis] Connection error:", err));
  return conn;
}
