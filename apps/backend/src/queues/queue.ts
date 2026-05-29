import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const notificationQueue = new Queue("notifications", {
  connection: redisConnection,
});

export const emailQueue = new Queue("emails", {
  connection: redisConnection,
});

export const billingQueue = new Queue("billing", {
  connection: redisConnection,
});