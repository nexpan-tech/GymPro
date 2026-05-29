import { Worker } from "bullmq";
import { redisConnection } from "../../queues/redis";

export const emailWorker = new Worker(
  "emails",
  async (job) => {
    console.log("Processing email job:", job.id, job.data);

    return {
      success: true,
      processedAt: new Date().toISOString(),
    };
  },
  {
    connection: redisConnection,
  }
);