import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { Role } from "@prisma/client";
import { BranchController } from "./branch.controller";

const router = Router();

router.use(authMiddleware);

// Branch management is restricted to gym leadership; members/trainers/
// receptionists may not create, modify, or re-assign branches.
const canManageBranches = requireRoles(
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.REGIONAL_MANAGER,
  Role.BRANCH_MANAGER
);

router.post("/", canManageBranches, BranchController.create);
router.get("/", BranchController.getAll);

router.get("/analytics/overview", BranchController.analyticsOverview);
router.get("/analytics/comparison", BranchController.comparisonAnalytics);

router.get("/my/branches", BranchController.myBranches);
router.post(
  "/:id/assign-regional-manager",
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  BranchController.assignRegionalManager
);

router.get("/central/report", BranchController.centralReport);

router.get("/:id", BranchController.getById);
router.put("/:id", canManageBranches, BranchController.update);

router.post("/:id/assign-user", canManageBranches, BranchController.assignUser);
router.post("/:id/assign-member", canManageBranches, BranchController.assignMember);

export default router;
