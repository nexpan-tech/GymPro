import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { BranchController } from "./branch.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", BranchController.create);
router.get("/", BranchController.getAll);

router.get("/analytics/overview", BranchController.analyticsOverview);
router.get("/analytics/comparison", BranchController.comparisonAnalytics);

router.get("/my/branches", BranchController.myBranches);
router.post("/:id/assign-regional-manager", BranchController.assignRegionalManager);

router.get("/central/report", BranchController.centralReport);

router.get("/:id", BranchController.getById);
router.put("/:id", BranchController.update);

router.get("/:id/analytics", BranchController.branchAnalytics);

router.post("/:id/assign-user", BranchController.assignUser);
router.post("/:id/assign-member", BranchController.assignMember);

export default router;