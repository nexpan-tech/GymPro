import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/upload.middleware";
import { uploadFile } from "./upload.controller";

const router = Router();

router.use(authMiddleware);

// Generic file upload (e.g. gym logo). The progress-photo upload route was
// removed — GymPro intentionally does NOT store user progress photos.
router.post("/", upload.single("file"), uploadFile);

export default router;