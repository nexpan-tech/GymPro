import { Worker } from "bullmq";
import { redisConnection } from "../../queues/redis";

export const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    console.log("Processing notification job:", job.id, job.data);

    return {
      success: true,
      processedAt: new Date().toISOString(),
    };
  },
  {
    connection: redisConnection,
  }
);