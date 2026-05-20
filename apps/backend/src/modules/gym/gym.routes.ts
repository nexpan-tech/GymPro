import { Router } from "express";
import { GymController } from "./gym.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);
router.use(requireRoles("SUPER_ADMIN"));

router.post("/", asyncHandler(GymController.create));
router.get("/", asyncHandler(GymController.getAll));
router.get("/:id", asyncHandler(GymController.getById));
router.patch("/:id", asyncHandler(GymController.update));
router.patch("/:id/activate", asyncHandler(GymController.activate));
router.patch("/:id/deactivate", asyncHandler(GymController.deactivate));
router.delete("/:id", asyncHandler(GymController.delete));

export default router;