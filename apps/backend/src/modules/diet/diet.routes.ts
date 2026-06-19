import { Router } from "express";
import { DietController } from "./diet.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  asyncHandler(DietController.create)
);

router.get(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(DietController.getAll)
);

// Completion tracking + analytics. Registered before "/:memberId" so the
// static path segments are not swallowed by the dynamic param route.
router.post(
  "/completions",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(DietController.complete)
);

router.get(
  "/completions",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(DietController.getCompletions)
);

router.get(
  "/analytics",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(DietController.getAnalytics)
);

// Member self-service — own structured plan with meals. Before "/:memberId".
router.get(
  "/my",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(DietController.getMy)
);

// Member self-service — today's meals (day-of-week filtered; ?day=<local weekday>).
router.get(
  "/my/today",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(DietController.getMyToday)
);

// Member self-service — full Mon–Sun diet week.
router.get(
  "/my/week",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(DietController.getMyWeek)
);

router.get(
  "/:memberId",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(DietController.getByMember)
);

router.put(
  "/:memberId",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  asyncHandler(DietController.update)
);

router.delete(
  "/:memberId",
  roleMiddleware([ROLES.ADMIN]),
  asyncHandler(DietController.delete)
);

export default router;