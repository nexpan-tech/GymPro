import { prisma } from "../../config/db";
import type { StreakType } from "@prisma/client";

/**
 * Stage 8 — date-aware streak engine. One row per (member, type).
 * Consecutive calendar days increment `current`; a gap resets it to 1; the same
 * day is idempotent. `longest` keeps the best-ever run.
 */

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function dayDiff(a: Date, b: Date) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);
}

export interface StreakResult {
  type: StreakType;
  current: number;
  longest: number;
  milestone: boolean; // true when current hits a 7-day multiple
  changed: boolean;
}

export class StreakService {
  /** Register activity for a streak type on a given day. */
  static async record(input: {
    gymId: string;
    memberId: string;
    type: StreakType;
    date?: Date;
  }): Promise<StreakResult> {
    const today = startOfDay(input.date ?? new Date());
    const existing = await prisma.memberStreak.findUnique({
      where: { memberId_type: { memberId: input.memberId, type: input.type } },
    });

    if (!existing) {
      const created = await prisma.memberStreak.create({
        data: { gymId: input.gymId, memberId: input.memberId, type: input.type, current: 1, longest: 1, lastActivityDate: today },
      });
      return { type: input.type, current: created.current, longest: created.longest, milestone: false, changed: true };
    }

    const last = existing.lastActivityDate ? startOfDay(existing.lastActivityDate) : null;
    const gap = last ? dayDiff(today, last) : null;

    // Same day → idempotent no-op.
    if (gap === 0) {
      return { type: input.type, current: existing.current, longest: existing.longest, milestone: false, changed: false };
    }

    const current = gap === 1 ? existing.current + 1 : 1; // consecutive vs reset
    const longest = Math.max(existing.longest, current);
    await prisma.memberStreak.update({
      where: { id: existing.id },
      data: { current, longest, lastActivityDate: today },
    });

    return { type: input.type, current, longest, milestone: current > 0 && current % 7 === 0, changed: true };
  }

  /** All three streak tracks for a member (filling defaults for untouched types). */
  static async getMemberStreaks(gymId: string, memberId: string) {
    const rows = await prisma.memberStreak.findMany({ where: { gymId, memberId } });
    const types: StreakType[] = ["ATTENDANCE", "WORKOUT", "DIET"];
    const today = startOfDay();
    return types.map((type) => {
      const r = rows.find((x) => x.type === type);
      // A streak is "active" only if the last activity was today or yesterday.
      const last = r?.lastActivityDate ? startOfDay(r.lastActivityDate) : null;
      const stale = last ? dayDiff(today, last) > 1 : true;
      return {
        type,
        current: r ? (stale ? 0 : r.current) : 0,
        longest: r?.longest ?? 0,
        lastActivityDate: r?.lastActivityDate ?? null,
      };
    });
  }
}
