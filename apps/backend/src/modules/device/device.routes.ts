import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { DeviceController } from "./device.controller";

const router = Router();

router.use(authMiddleware);

router.post("/register", DeviceController.register);
router.get("/mine", DeviceController.getMine);
router.delete("/", DeviceController.delete);

export default router;