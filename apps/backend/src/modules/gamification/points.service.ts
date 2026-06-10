import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import type { PointEvent, Prisma } from "@prisma/client";

/**
 * Stage 8 — central points/XP engine.
 *
 * Model:
 *  - Every points change is an append-only PointTransaction (earn = +, spend = -).
 *  - MemberXP.xp = LIFETIME earned points (monotonic) → drives level.
 *  - Spendable balance = SUM of all PointTransaction.points for the member.
 *  - Idempotency: PointTransaction has @@unique([gymId, eventKey]); re-firing the
 *    same logical event is a no-op (no double points).
 */

export const POINT_RULES: Record<PointEvent, number> = {
  ATTENDANCE_CHECKIN: 10,
  WORKOUT_COMPLETED: 15,
  DIET_COMPLETED: 10,
  PROGRESS_UPDATED: 10,
  CHALLENGE_JOINED: 5,
  CHALLENGE_COMPLETED: 50,
  REFERRAL_CONVERTED: 100,
  MEMBERSHIP_RENEWED: 25,
  MISSION_COMPLETED: 10,
  STREAK_MILESTONE: 25,
  REWARD_REDEEMED: 0,
};

export function levelForXp(xp: number) {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}

export interface AwardInput {
  gymId: string;
  memberId: string;
  event: PointEvent;
  /** Override the default rule amount (e.g. mission.xpReward, challenge bonus). */
  points?: number;
  refType?: string;
  refId?: string;
  /** Explicit idempotency key; defaults to `${event}:${refId ?? 'global'}`. */
  eventKey?: string;
}

export interface AwardResult {
  awarded: boolean;
  points: number;
  lifetimePoints: number;
  level: number;
  balance: number;
}

type Db = Prisma.TransactionClient | typeof prisma;

export class PointsService {
  /** Idempotently grant points for an event and bump lifetime XP/level. */
  static async award(input: AwardInput): Promise<AwardResult> {
    const points = input.points ?? POINT_RULES[input.event];
    const eventKey = input.eventKey ?? `${input.event}:${input.refId ?? "global"}`;

    try {
      return await prisma.$transaction(async (db) => {
        await db.pointTransaction.create({
          data: {
            gymId: input.gymId,
            memberId: input.memberId,
            event: input.event,
            points,
            refType: input.refType,
            refId: input.refId,
            eventKey,
          },
        });
        const xp = await this.bumpXp(db, input.gymId, input.memberId, points);
        const balance = await this.balance(input.memberId, db);
        return { awarded: true, points, lifetimePoints: xp.xp, level: xp.level, balance };
      });
    } catch (e) {
      // Unique violation on (gymId, eventKey) → already awarded; no-op.
      if ((e as { code?: string }).code === "P2002") {
        const summary = await this.summary(input.memberId);
        return { awarded: false, points: 0, lifetimePoints: summary.lifetimePoints, level: summary.level, balance: summary.balance };
      }
      throw e;
    }
  }

  /** Spend points (e.g. reward redemption). Validates the spendable balance. */
  static async spend(input: {
    gymId: string;
    memberId: string;
    points: number;
    refType?: string;
    refId?: string;
    eventKey: string;
  }) {
    const cost = Math.abs(input.points);
    const balance = await this.balance(input.memberId);
    if (balance < cost) {
      throw new AppError(`Not enough points (have ${balance}, need ${cost})`, 400);
    }
    await prisma.pointTransaction.create({
      data: {
        gymId: input.gymId,
        memberId: input.memberId,
        event: "REWARD_REDEEMED",
        points: -cost,
        refType: input.refType,
        refId: input.refId,
        eventKey: input.eventKey,
      },
    });
    return { spent: cost, balance: balance - cost };
  }

  /** Lifetime XP + level mirror (positive earns only). */
  private static async bumpXp(db: Db, gymId: string, memberId: string, points: number) {
    if (points <= 0) {
      const existing = await db.memberXP.findUnique({ where: { memberId } });
      return existing ?? { xp: 0, level: 1 };
    }
    const current = await db.memberXP.findUnique({ where: { memberId } });
    const xp = (current?.xp ?? 0) + points;
    const level = levelForXp(xp);
    return db.memberXP.upsert({
      where: { memberId },
      update: { xp, level },
      create: { gymId, memberId, xp, level },
    });
  }

  /** Spendable balance = sum of every ledger entry (earns − spends). */
  static async balance(memberId: string, db: Db = prisma): Promise<number> {
    const agg = await db.pointTransaction.aggregate({
      where: { memberId },
      _sum: { points: true },
    });
    return agg._sum.points ?? 0;
  }

  static async summary(memberId: string) {
    const [xp, balance] = await Promise.all([
      prisma.memberXP.findUnique({ where: { memberId } }),
      this.balance(memberId),
    ]);
    return {
      lifetimePoints: xp?.xp ?? 0,
      level: xp?.level ?? 1,
      balance,
      streak: xp?.streak ?? 0,
    };
  }

  static async history(gymId: string, memberId: string, limit = 50) {
    return prisma.pointTransaction.findMany({
      where: { gymId, memberId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
