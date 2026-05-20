import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { processDailyAttendance } from "../../jobs/attendance.job";
import { processRenewalReminders } from "../../jobs/renewalReminder.job";

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

export default router;