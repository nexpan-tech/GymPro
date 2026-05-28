import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { CommunityController } from "./community.controller";

const router = Router();

router.use(authMiddleware);

router.post("/challenges", CommunityController.createChallenge);
router.get("/challenges", CommunityController.getChallenges);

router.post("/groups", CommunityController.createGroup);
router.get("/groups", CommunityController.getGroups);
router.post("/groups/:id/join", CommunityController.joinGroup);

router.post("/challenges/:id/join", CommunityController.joinChallenge);
router.patch("/challenges/:id/progress", CommunityController.updateProgress);
router.get("/challenges/:id/leaderboard", CommunityController.leaderboard);

router.get("/leaderboard", CommunityController.globalLeaderboard);

export default router;