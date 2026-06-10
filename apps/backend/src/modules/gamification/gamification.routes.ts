import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { GamificationController } from "./gamification.controller";

const router = Router();

router.use(authMiddleware);

const STAFF = [ROLES.ADMIN, ROLES.RECEPTIONIST];
const STAFF_TRAINER = [...STAFF, ROLES.TRAINER];
const ALL = [...STAFF_TRAINER, ROLES.MEMBER];

// ── Member self-service (Stage 8) — static paths before parameterised ones ──
router.get("/me/summary", roleMiddleware(ALL), GamificationController.mySummary);
router.get("/me/points", roleMiddleware(ALL), GamificationController.myPointHistory);
router.get("/me/redemptions", roleMiddleware([ROLES.MEMBER]), GamificationController.myRedemptions);

// Leaderboards (any authenticated gym user).
router.get("/leaderboard", roleMiddleware(ALL), GamificationController.leaderboard);

// Engagement analytics (management).
router.get("/analytics", roleMiddleware(STAFF), GamificationController.analytics);
router.get("/trainer/members", roleMiddleware([ROLES.TRAINER, ...STAFF]), GamificationController.trainerMembers);
router.get("/platform", roleMiddleware([ROLES.SUPER_ADMIN]), GamificationController.platformEngagement);

// ── XP / streak (staff write; read scoped) ──
router.post("/xp", roleMiddleware(STAFF_TRAINER), GamificationController.addXp);
router.get("/xp/:memberId", roleMiddleware(STAFF_TRAINER), GamificationController.getMemberXp);
router.post("/streak", roleMiddleware(STAFF_TRAINER), GamificationController.updateStreak);

// ── Missions ──
router.post("/missions", roleMiddleware(STAFF), GamificationController.createMission);
router.get("/missions", roleMiddleware(ALL), GamificationController.getMissions);
router.post("/missions/:id/complete", roleMiddleware(STAFF_TRAINER), GamificationController.completeMission);

// ── Rewards catalogue + redemption ──
router.post("/rewards", roleMiddleware(STAFF), GamificationController.createReward);
router.get("/rewards", roleMiddleware(ALL), GamificationController.getRewards);
router.post("/rewards/:id/redeem", roleMiddleware([ROLES.MEMBER, ...STAFF]), GamificationController.redeemReward);

// ── Redemptions admin ──
router.get("/redemptions", roleMiddleware(STAFF), GamificationController.listRedemptions);
router.patch("/redemptions/:id", roleMiddleware(STAFF), GamificationController.updateRedemptionStatus);

export default router;
