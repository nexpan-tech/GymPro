import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import ReportsController from "./reports.controller";

const router = Router();

router.use(authMiddleware);
// Revenue / churn / member reports are gym-admin data — never member/trainer.
// (Service layer already scopes by gymId; this adds the missing role gate.)
router.use(roleMiddleware(["ADMIN", "RECEPTIONIST"]));

router.get("/monthly", ReportsController.monthly);
router.get("/revenue", ReportsController.revenue);
router.get("/attendance", ReportsController.attendance);
router.get("/members", ReportsController.members);
router.get("/churn", ReportsController.churn);

export default router;