import { Worker } from "bullmq";
import { redisConnection } from "../../queues/redis";

export const billingWorker = new Worker(
  "billing",
  async (job) => {
    console.log("Processing billing job:", job.id, job.data);

    return {
      success: true,
      processedAt: new Date().toISOString(),
    };
  },
  {
    connection: redisConnection,
  }
);