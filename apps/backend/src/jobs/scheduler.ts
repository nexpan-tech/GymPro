import cron from "node-cron";
import { logger } from "../config/logger";
import { processDueReminders } from "./dueReminder.job";
import { processRenewalCampaigns } from "./renewalCampaign.job";
import { processInactiveMembers } from "./inactiveMember.job";
import { processRenewalReminders } from "./renewalReminder.job";
import { processEngagementReminders } from "./engagement-reminder.job";
import { processScoreRecompute } from "./scoreRecompute.job";
import { processChurnRiskAlerts } from "./churnRisk.job";
import { processTrialConversionReminders } from "./trialConversion.job";
import { processMonthlyBilling } from "./monthlyBilling.job";
import { processLicenseLifecycle } from "./licenseLifecycle.job";

export function startSchedulers() {
  logger.info("Automation schedulers initialized");

  // ── Stage 12 — automated monthly SaaS billing ──────────────────────────────
  // 00:05 on the 1st of every month: generate flat license invoices for all
  // active-licensed gyms.
  cron.schedule("5 0 1 * *", async () => {
    logger.info("Running automated monthly SaaS billing");
    await processMonthlyBilling();
  });

  // ── License lifecycle automation ───────────────────────────────────────────
  // 01:00 daily: expire lapsed trials, move ended terms to PAST_DUE, suspend
  // after the grace period, and send trial/renewal reminder emails.
  cron.schedule("0 1 * * *", async () => {
    logger.info("Running license lifecycle automation");
    await processLicenseLifecycle();
  });

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

  // ── Stage 7 — retention & CRM automation ──────────────────────────────────

  // 02:00 — recompute + persist retention/risk scores while traffic is low.
  cron.schedule("0 2 * * *", async () => {
    logger.info("Running retention score recompute");
    await processScoreRecompute();
  });

  // 09:00 — alert staff to HIGH/CRITICAL churn-risk members (post-recompute).
  cron.schedule("0 9 * * *", async () => {
    logger.info("Running churn risk alerts");
    await processChurnRiskAlerts();
  });

  // 09:15 — engagement nudges (missed workouts, goals, attendance drop).
  cron.schedule("15 9 * * *", async () => {
    logger.info("Running engagement reminders");
    await processEngagementReminders();
  });

  // 09:30 — trial-conversion follow-ups + lapse expired trials.
  cron.schedule("30 9 * * *", async () => {
    logger.info("Running trial conversion reminders");
    await processTrialConversionReminders();
  });
}