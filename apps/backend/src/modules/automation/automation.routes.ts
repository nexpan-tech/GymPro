import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { processDailyAttendance } from "../../jobs/attendance.job";
import { processRenewalReminders } from "../../jobs/renewalReminder.job";
import { processDueReminders } from "../../jobs/dueReminder.job";
import { processRenewalCampaigns } from "../../jobs/renewalCampaign.job";
import { processInactiveMembers } from "../../jobs/inactiveMember.job";

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
export default router;