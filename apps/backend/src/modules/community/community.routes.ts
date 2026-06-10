import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { CommunityController } from "./community.controller";

const router = Router();

router.use(authMiddleware);

const STAFF = [ROLES.ADMIN, ROLES.RECEPTIONIST];
const STAFF_TRAINER = [...STAFF, ROLES.TRAINER];
const ALL = [...STAFF_TRAINER, ROLES.MEMBER];

// Challenges — staff create; everyone reads; members join/progress.
router.post("/challenges", roleMiddleware(STAFF), CommunityController.createChallenge);
router.get("/challenges", roleMiddleware(ALL), CommunityController.getChallenges);
router.post("/challenges/:id/join", roleMiddleware([ROLES.MEMBER, ...STAFF]), CommunityController.joinChallenge);
router.patch("/challenges/:id/progress", roleMiddleware([ROLES.MEMBER, ...STAFF_TRAINER]), CommunityController.updateProgress);
router.get("/challenges/:id/leaderboard", roleMiddleware(ALL), CommunityController.leaderboard);

// Groups
router.post("/groups", roleMiddleware(STAFF), CommunityController.createGroup);
router.get("/groups", roleMiddleware(ALL), CommunityController.getGroups);
router.post("/groups/:id/join", roleMiddleware([ROLES.MEMBER, ...STAFF]), CommunityController.joinGroup);

// Global XP leaderboard
router.get("/leaderboard", roleMiddleware(ALL), CommunityController.globalLeaderboard);

export default router;
