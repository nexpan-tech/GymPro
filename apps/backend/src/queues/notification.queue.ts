import { Queue } from "bullmq";
import { redisConnection, defaultJobOptions } from "../queues/redis";

export const notificationQueue = new Queue("notifications", {
  connection: redisConnection,
  defaultJobOptions,
});