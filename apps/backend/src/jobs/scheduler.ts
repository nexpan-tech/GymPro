import cron from "node-cron";
import { logger } from "../config/logger";
import { processDueReminders } from "./dueReminder.job";
import { processRenewalCampaigns } from "./renewalCampaign.job";
import { processInactiveMembers } from "./inactiveMember.job";
import { processRenewalReminders } from "./renewalReminder.job";

export function startSchedulers() {
  logger.info("Automation schedulers initialized");

  // Every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    logger.info("Running daily due reminders");
    await processDueReminders();
  });

  // Every day at 8:15 AM
  cron.schedule("15 8 * * *", async () => {
    logger.info("Running renewal campaigns");
    await processRenewalCampaigns();
  });

  // Every day at 8:30 AM
  cron.schedule("30 8 * * *", async () => {
    logger.info("Running inactive member detection");
    await processInactiveMembers();
  });

  // Every day at 8:45 AM
  cron.schedule("45 8 * * *", async () => {
    logger.info("Running renewal reminder scan");
    await processRenewalReminders();
  });
}