import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/upload.middleware";
import { uploadFile, uploadProgressPhoto } from "./upload.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", upload.single("file"), uploadFile);
router.post("/progress-photo", upload.single("photo"), uploadProgressPhoto);

export default router;