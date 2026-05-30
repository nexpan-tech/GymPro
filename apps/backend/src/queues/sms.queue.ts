import { Queue } from "bullmq";
import { redisConnection, defaultJobOptions } from "../queues/redis";

export const smsQueue = new Queue("sms", {
  connection: redisConnection,
  defaultJobOptions,
});