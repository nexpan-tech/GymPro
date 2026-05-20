import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/upload.middleware";
import { uploadFile } from "./upload.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", upload.single("file"), uploadFile);

export default router;