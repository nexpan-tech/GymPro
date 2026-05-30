import { billingQueue, emailQueue, notificationQueue } from "./queue";

export async function addNotificationJob(data: any) {
  return notificationQueue.add("send-notification", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 500, age: 86400 },
    removeOnFail: false,
  });
}

export async function addEmailJob(data: any) {
  return emailQueue.add("send-email", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 500, age: 86400 },
    removeOnFail: false,
  });
}

export async function addBillingJob(data: any) {
  return billingQueue.add("process-billing", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 500, age: 86400 },
    removeOnFail: false,
  });
}