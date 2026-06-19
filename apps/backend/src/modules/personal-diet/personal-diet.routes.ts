import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { asyncHandler } from "../../utils/asyncHandler";
import { PersonalDietController } from "./personal-diet.controller";

const router = Router();
router.use(authMiddleware, roleMiddleware([ROLES.MEMBER]));

router.get("/", asyncHandler(PersonalDietController.list));
router.post("/", asyncHandler(PersonalDietController.create));
router.get("/stats", asyncHandler(PersonalDietController.stats));
router.get("/week", asyncHandler(PersonalDietController.week));
router.get("/water", asyncHandler(PersonalDietController.getWater));
router.put("/water", asyncHandler(PersonalDietController.setWater));

router.get("/:id", asyncHandler(PersonalDietController.get));
router.patch("/:id", asyncHandler(PersonalDietController.update));
router.delete("/:id", asyncHandler(PersonalDietController.remove));
router.post("/:id/duplicate", asyncHandler(PersonalDietController.duplicate));
router.patch("/:id/archive", asyncHandler(PersonalDietController.archive));
router.patch("/:id/favorite", asyncHandler(PersonalDietController.favorite));

export default router;
