import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import ReportsController from "./reports.controller";

const router = Router();

router.use(authMiddleware);

router.get("/revenue", ReportsController.revenue);
router.get("/attendance", ReportsController.attendance);
router.get("/members", ReportsController.members);
router.get("/churn", ReportsController.churn);

export default router;