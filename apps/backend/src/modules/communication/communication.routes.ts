import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { CommunicationController } from "./communication.controller";

const router = Router();

router.use(authMiddleware);

router.post("/messages", CommunicationController.sendMessage);
router.get("/messages/member/:memberId", CommunicationController.getMemberMessages);

router.post("/progress-comments", CommunicationController.addProgressComment);

router.post("/feedback", CommunicationController.submitFeedback);
router.get("/feedback/trainer/:trainerId", CommunicationController.getTrainerFeedback);

export default router;