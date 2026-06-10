import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { processDailyAttendance } from "../../jobs/attendance.job";
import { processRenewalReminders } from "../../jobs/renewalReminder.job";
import { processDueReminders } from "../../jobs/dueReminder.job";
import { processRenewalCampaigns } from "../../jobs/renewalCampaign.job";
import { processInactiveMembers } from "../../jobs/inactiveMember.job";
import { processRetentionAlerts } from "../../jobs/retention.job";
import { processEngagementReminders } from "../../jobs/engagement-reminder.job";
import { processScoreRecompute } from "../../jobs/scoreRecompute.job";
import { processChurnRiskAlerts } from "../../jobs/churnRisk.job";
import { processTrialConversionReminders } from "../../jobs/trialConversion.job";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.ADMIN, ROLES.SUPER_ADMIN]));

router.post("/attendance", async (_req, res) => {
  const result = await processDailyAttendance();

  return res.json({
    success: true,
    message: "Attendance automation completed",
    data: result,
  });
});

router.post("/renewals", async (_req, res) => {
  const result = await processRenewalReminders();

  return res.json({
    success: true,
    message: "Renewal automation completed",
    data: result,
  });
});
router.post("/dues", async (_req, res) => {
  const result = await processDueReminders();

  return res.json({
    success: true,
    message: "Due reminder automation completed",
    data: result,
  });
});
router.post("/renewal-campaigns", async (_req, res) => {
  const result = await processRenewalCampaigns();

  return res.json({
    success: true,
    message: "Renewal campaign automation completed",
    data: result,
  });
});
router.post("/inactive-members", async (_req, res) => {
  const result = await processInactiveMembers();

  return res.json({
    success: true,
    message: "Inactive member automation completed",
    data: result,
  });
});
router.post("/retention-alerts", async (_req, res) => {
  const result = await processRetentionAlerts();

  return res.json({
    success: true,
    message: "Retention alerts processed successfully",
    data: result,
  });
});
router.post("/engagement-reminders", async (_req, res) => {
  const result = await processEngagementReminders();

  return res.json({
    success: true,
    message: "Engagement reminders processed successfully",
    data: result,
  });
});

// ── Stage 7 — retention & CRM automation ──────────────────────────────────
router.post("/score-recompute", async (_req, res) => {
  const result = await processScoreRecompute();
  return res.json({ success: true, message: "Retention scores recomputed", data: result });
});
router.post("/churn-risk", async (_req, res) => {
  const result = await processChurnRiskAlerts();
  return res.json({ success: true, message: "Churn risk alerts processed", data: result });
});
router.post("/trial-conversion", async (_req, res) => {
  const result = await processTrialConversionReminders();
  return res.json({ success: true, message: "Trial conversion reminders processed", data: result });
});
export default router;