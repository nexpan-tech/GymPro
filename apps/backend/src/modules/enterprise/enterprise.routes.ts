import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { EnterpriseService } from "./enterprise.service";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.SUPER_ADMIN]));

router.get(
  "/overview",
  asyncHandler(async (_req: Request, res: Response) => successResponse(res, "Enterprise analytics", await EnterpriseService.overview())),
);

export default router;
