import { logger } from "../../config/logger";
import { PointsService } from "./points.service";
import { StreakService } from "./streak.service";
import { NotificationService } from "../notification/notification.service";
import type { StreakType } from "@prisma/client";

/**
 * Stage 8 — single entry point existing flows call to fire engagement side
 * effects (points + streak + milestone notification). Best-effort: a failure
 * here NEVER breaks the core action (check-in, completion, etc.).
 */

async function safe(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    logger.error(`gamification event failed: ${label}`, err);
  }
}

async function streakWithMilestone(
  gymId: string,
  memberId: string,
  type: StreakType,
  date?: Date,
) {
  const s = await StreakService.record({ gymId, memberId, type, date });
  if (s.milestone) {
    await PointsService.award({
      gymId,
      memberId,
      event: "STREAK_MILESTONE",
      refType: "streak",
      refId: `${type}:${s.current}`,
      eventKey: `STREAK_MILESTONE:${type}:${s.current}`,
    });
    await NotificationService.create(gymId, {
      memberId,
      type: "GENERAL",
      title: `🔥 ${s.current}-day ${type.toLowerCase()} streak!`,
      message: `You hit a ${s.current}-day ${type.toLowerCase()} streak. Bonus points awarded — keep it going!`,
    }).catch(() => undefined);
  }
}

export class GamificationEvents {
  static attendanceCheckin(p: { gymId: string; memberId: string; attendanceId?: string; date?: Date }) {
    return safe("attendanceCheckin", async () => {
      await PointsService.award({
        gymId: p.gymId,
        memberId: p.memberId,
        event: "ATTENDANCE_CHECKIN",
        refType: "attendance",
        refId: p.attendanceId,
      });
      await streakWithMilestone(p.gymId, p.memberId, "ATTENDANCE", p.date);
    });
  }

  static workoutCompleted(p: { gymId: string; memberId: string; completionId?: string; date?: Date }) {
    return safe("workoutCompleted", async () => {
      await PointsService.award({
        gymId: p.gymId,
        memberId: p.memberId,
        event: "WORKOUT_COMPLETED",
        refType: "workoutCompletion",
        refId: p.completionId,
      });
      await streakWithMilestone(p.gymId, p.memberId, "WORKOUT", p.date);
    });
  }

  static dietCompleted(p: { gymId: string; memberId: string; completionId?: string; date?: Date }) {
    return safe("dietCompleted", async () => {
      await PointsService.award({
        gymId: p.gymId,
        memberId: p.memberId,
        event: "DIET_COMPLETED",
        refType: "dietCompletion",
        refId: p.completionId,
      });
      await streakWithMilestone(p.gymId, p.memberId, "DIET", p.date);
    });
  }

  static progressUpdated(p: { gymId: string; memberId: string; measurementId?: string }) {
    return safe("progressUpdated", () =>
      PointsService.award({
        gymId: p.gymId,
        memberId: p.memberId,
        event: "PROGRESS_UPDATED",
        refType: "bodyMeasurement",
        refId: p.measurementId,
      }).then(() => undefined),
    );
  }

  static challengeJoined(p: { gymId: string; memberId: string; challengeId: string }) {
    return safe("challengeJoined", () =>
      PointsService.award({
        gymId: p.gymId,
        memberId: p.memberId,
        event: "CHALLENGE_JOINED",
        refType: "challenge",
        refId: p.challengeId,
        eventKey: `CHALLENGE_JOINED:${p.challengeId}:${p.memberId}`,
      }).then(() => undefined),
    );
  }

  static challengeCompleted(p: { gymId: string; memberId: string; challengeId: string; title?: string }) {
    return safe("challengeCompleted", async () => {
      const res = await PointsService.award({
        gymId: p.gymId,
        memberId: p.memberId,
        event: "CHALLENGE_COMPLETED",
        refType: "challenge",
        refId: p.challengeId,
        eventKey: `CHALLENGE_COMPLETED:${p.challengeId}:${p.memberId}`,
      });
      if (res.awarded) {
        await NotificationService.create(p.gymId, {
          memberId: p.memberId,
          type: "GENERAL",
          title: "🏆 Challenge completed!",
          message: `You completed "${p.title ?? "a challenge"}" and earned ${res.points} points. Well done!`,
        }).catch(() => undefined);
      }
    });
  }

  static referralConverted(p: { gymId: string; memberId: string; referralId: string; points?: number }) {
    return safe("referralConverted", async () => {
      const res = await PointsService.award({
        gymId: p.gymId,
        memberId: p.memberId,
        event: "REFERRAL_CONVERTED",
        points: p.points,
        refType: "referral",
        refId: p.referralId,
        eventKey: `REFERRAL_CONVERTED:${p.referralId}`,
      });
      if (res.awarded) {
        await NotificationService.create(p.gymId, {
          memberId: p.memberId,
          type: "GENERAL",
          title: "🎉 Referral converted!",
          message: `Your referral joined the gym — you earned ${res.points} points. Thank you!`,
        }).catch(() => undefined);
      }
    });
  }

  static membershipRenewed(p: { gymId: string; memberId: string; membershipId?: string }) {
    return safe("membershipRenewed", () =>
      PointsService.award({
        gymId: p.gymId,
        memberId: p.memberId,
        event: "MEMBERSHIP_RENEWED",
        refType: "membership",
        refId: p.membershipId,
      }).then(() => undefined),
    );
  }
}
