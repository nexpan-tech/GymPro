import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { asyncHandler } from "../../utils/asyncHandler";
import { LicenseController } from "./license.controller";

const router = Router();

router.use(authMiddleware);

// ── Gym-admin (and gym staff): read-only view of their own license ──────────
router.get(
  "/me",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  asyncHandler(LicenseController.myLicense),
);

// ── Super Admin only: full License Management ───────────────────────────────
const sa = roleMiddleware([ROLES.SUPER_ADMIN]);

// Plan comparison matrix (any gym staff may view — drives upgrade prompts)
router.get("/comparison", roleMiddleware([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECEPTIONIST]), asyncHandler(LicenseController.comparison));

// License plan catalogue (CRUD)
router.get("/plans", sa, asyncHandler(LicenseController.listPlans));
router.post("/plans", sa, asyncHandler(LicenseController.createPlan));
router.patch("/plans/:id", sa, asyncHandler(LicenseController.updatePlan));

// Gym licenses (dashboard grid + detail + history + audit)
router.get("/", sa, asyncHandler(LicenseController.listLicenses));
router.get("/billing/summary", sa, asyncHandler(LicenseController.billingSummary));
router.get("/gyms/:gymId", sa, asyncHandler(LicenseController.getGymLicense));
router.get("/gyms/:gymId/history", sa, asyncHandler(LicenseController.getHistory));
router.get("/gyms/:gymId/audit", sa, asyncHandler(LicenseController.getAudit));

// Lifecycle (assign / upgrade / downgrade / trial / suspend / resume / cancel)
router.post("/gyms/:gymId/assign", sa, asyncHandler(LicenseController.assignPlan));
router.post("/gyms/:gymId/suspend", sa, asyncHandler(LicenseController.suspend));
router.post("/gyms/:gymId/resume", sa, asyncHandler(LicenseController.resume));
router.post("/gyms/:gymId/cancel", sa, asyncHandler(LicenseController.cancel));
router.post("/gyms/:gymId/renew", sa, asyncHandler(LicenseController.renew));

// Trial management (license trials)
router.post("/gyms/:gymId/convert-trial", sa, asyncHandler(LicenseController.convertTrial));
router.post("/gyms/:gymId/extend-trial", sa, asyncHandler(LicenseController.extendTrial));

// Lifecycle automation (manual trigger; also runs daily via scheduler)
router.post("/lifecycle/run", sa, asyncHandler(LicenseController.runLifecycle));

// Monthly flat-fee invoice generation
router.post("/generate", sa, asyncHandler(LicenseController.generate));

export default router;
