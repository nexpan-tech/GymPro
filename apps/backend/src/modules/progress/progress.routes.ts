import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { ProgressController } from "./progress.controller";

const router = Router();

router.use(authMiddleware);

router.post("/measurements", ProgressController.createMeasurement);
router.get("/measurements/me", ProgressController.getMyMeasurements);
router.get("/measurements/member/:memberId", ProgressController.getMemberMeasurements);
router.get("/summary/member/:memberId", ProgressController.getProgressSummary);
router.delete("/measurements/:id", ProgressController.deleteMeasurement);
router.get("/analytics/member/:memberId", ProgressController.getAnalytics);

// Progress photos (mobile)
router.get("/photos", ProgressController.getMyPhotos);
router.delete("/photos/:id", ProgressController.deletePhoto);

export default router;