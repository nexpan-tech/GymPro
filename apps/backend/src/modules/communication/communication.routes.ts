import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { chatLimiter } from "../../middleware/rateLimits";
import { CommunicationController } from "./communication.controller";

const router = Router();

router.use(authMiddleware);

const STAFF = [ROLES.ADMIN, ROLES.RECEPTIONIST];
const CHAT = [ROLES.MEMBER, ROLES.TRAINER, ...STAFF];

// ── Trainer-member chat ──
// Member self thread (their assigned trainer). Static path before "/member/:id".
router.get("/messages/me", roleMiddleware([ROLES.MEMBER]), CommunicationController.getMyThread);
// Trainer/admin thread list.
router.get("/threads", roleMiddleware([ROLES.TRAINER, ...STAFF]), CommunicationController.getThreads);

router.post("/messages", chatLimiter, roleMiddleware(CHAT), CommunicationController.sendMessage);
router.get("/messages/member/:memberId", roleMiddleware(CHAT), CommunicationController.getMemberMessages);
router.patch("/messages/member/:memberId/read", roleMiddleware(CHAT), CommunicationController.markThreadRead);

// ── Progress comments + feedback (trainer/staff) ──
router.post("/progress-comments", roleMiddleware([ROLES.TRAINER, ...STAFF]), CommunicationController.addProgressComment);
router.post("/feedback", roleMiddleware([ROLES.MEMBER, ...STAFF]), CommunicationController.submitFeedback);
router.get("/feedback/trainer/:trainerId", roleMiddleware([ROLES.TRAINER, ...STAFF]), CommunicationController.getTrainerFeedback);

export default router;
