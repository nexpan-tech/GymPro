import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { TransformationController } from "./transformation.controller";

const router = Router();

router.use(authMiddleware);

router.post("/photos", TransformationController.addPhoto);
router.get("/photos/me", TransformationController.getMyPhotos);
router.get("/photos/member/:memberId", TransformationController.getMemberPhotos);
router.get("/before-after/member/:memberId", TransformationController.getBeforeAfter);
router.get("/timeline/member/:memberId", TransformationController.getTimeline);
router.delete("/photos/:id", TransformationController.deletePhoto);

export default router;