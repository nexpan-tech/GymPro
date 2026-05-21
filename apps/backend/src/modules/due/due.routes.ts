import { Router } from "express";
import { DueController } from "./due.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]));

router.post("/", DueController.create);
router.get("/", DueController.getAll);
router.get("/summary", DueController.getSummary);
router.get("/overdue-aging", DueController.getOverdueAging);
router.post("/mark-overdue", DueController.markOverdue);
router.patch("/:id/pay", DueController.markPaid);
router.patch("/:id/waive", DueController.waive);
router.get("/dashboard", DueController.getDashboard);
router.get("/pending", DueController.getPending);
router.get("/overdue", DueController.getOverdue);

export default router;