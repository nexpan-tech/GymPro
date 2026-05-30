import { Queue } from "bullmq";
import { redisConnection, defaultJobOptions } from "./redis";

export const notificationQueue = new Queue("notifications", {
  connection: redisConnection,
  defaultJobOptions,
});

export const emailQueue = new Queue("emails", {
  connection: redisConnection,
  defaultJobOptions,
});

export const billingQueue = new Queue("billing", {
  connection: redisConnection,
  defaultJobOptions,
});