import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const smsQueue = new Queue("sms", {
  connection: redisConnection,
});