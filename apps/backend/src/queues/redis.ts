const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
const parsed = new URL(redisUrl);

export const redisConnection = {
  host: parsed.hostname,
  port: parseInt(parsed.port || "6379"),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { count: 500, age: 86400 },
  removeOnFail: false,
};
