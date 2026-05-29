import { notificationWorker } from "./jobs/notification.worker";
import { emailWorker } from "./jobs/email.worker";
import { billingWorker } from "./jobs/billing.worker";

console.log("🚀 GymPro workers started");

notificationWorker.on("completed", (job) => {
  console.log(`✅ Notification job completed: ${job.id}`);
});

notificationWorker.on("failed", (job, error) => {
  console.error(`❌ Notification job failed: ${job?.id}`, error);
});

emailWorker.on("completed", (job) => {
  console.log(`✅ Email job completed: ${job.id}`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`❌ Email job failed: ${job?.id}`, error);
});

billingWorker.on("completed", (job) => {
  console.log(`✅ Billing job completed: ${job.id}`);
});

billingWorker.on("failed", (job, error) => {
  console.error(`❌ Billing job failed: ${job?.id}`, error);
});

process.on("SIGINT", async () => {
  console.log("Shutting down workers...");

  await notificationWorker.close();
  await emailWorker.close();
  await billingWorker.close();

  process.exit(0);
});