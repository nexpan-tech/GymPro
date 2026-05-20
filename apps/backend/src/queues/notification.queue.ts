import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const notificationQueue = new Queue("notifications", {
  connection: redisConnection,
});