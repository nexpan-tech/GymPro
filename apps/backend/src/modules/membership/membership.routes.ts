import { Router } from "express";
import { MembershipController } from "./membership.controller";
import { MembershipPlanController } from "./membership-plan.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authMiddleware);

/**
 * Membership & plan management.
 * Literal routes are declared before parameterised ones so e.g. `/plans` and
 * `/analytics` are not captured by `/:id`.
 */

// ─── Membership plans (gym-scoped catalogue) ─────────────────────────────────
// Member-facing active catalogue (+ GST %). Declared before "/plans/:id" and
// open to members so they can pick a plan to pay/renew — own gym only.
router.get(
  "/plans/public",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.TRAINER, ROLES.MEMBER]),
  MembershipPlanController.listPublic
);
router.get(
  "/plans",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  MembershipPlanController.list
);
router.post(
  "/plans",
  roleMiddleware([ROLES.ADMIN]),
  MembershipPlanController.create
);
router.patch(
  "/plans/:id",
  roleMiddleware([ROLES.ADMIN]),
  MembershipPlanController.update
);
router.delete(
  "/plans/:id",
  roleMiddleware([ROLES.ADMIN]),
  MembershipPlanController.remove
);

// ─── Member self-service ─────────────────────────────────────────────────────
router.get(
  "/my",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.TRAINER, ROLES.MEMBER]),
  MembershipController.getMy
);

// ─── Analytics ───────────────────────────────────────────────────────────────
router.get(
  "/analytics",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  MembershipController.analytics
);

// ─── Memberships ─────────────────────────────────────────────────────────────
router.post(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  MembershipController.create
);

router.get(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  MembershipController.getAll
);

router.get(
  "/member/:memberId",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.TRAINER]),
  MembershipController.getByMember
);

router.post(
  "/:id/renew",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  MembershipController.renew
);

router.post(
  "/:id/freeze",
  roleMiddleware([ROLES.ADMIN]),
  MembershipController.freeze
);

router.post(
  "/:id/extend",
  roleMiddleware([ROLES.ADMIN]),
  MembershipController.extend
);

router.put("/:id", roleMiddleware([ROLES.ADMIN]), MembershipController.update);

router.delete("/:id", roleMiddleware([ROLES.ADMIN]), MembershipController.delete);

export default router;
