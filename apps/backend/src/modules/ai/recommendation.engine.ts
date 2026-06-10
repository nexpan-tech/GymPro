import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = { id: string; role: string; gymId: string | null };

export type RecommendationCategory = "WORKOUT" | "DIET" | "ENGAGEMENT" | "RENEWAL" | "CHALLENGE";

export interface Recommendation {
  title: string;
  description: string;
  confidence: number; // 0–1
  category: RecommendationCategory;
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysSince(date?: Date | null) {
  if (!date) return null;
  return Math.floor((startOfDay().getTime() - startOfDay(new Date(date)).getTime()) / 86_400_000);
}

/**
 * Stage 10 — rule-based recommendation engine. Reuses the SAME member data that
 * powers Stages 3–8 (attendance, completions, progress, streaks, memberships,
 * challenges) and the persisted retention score — no external AI.
 */
export class RecommendationEngine {
  static async forMember(gymId: string, memberId: string): Promise<Recommendation[]> {
    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId },
      include: {
        attendances: { orderBy: { date: "desc" } },
        workoutCompletions: true,
        dietCompletions: true,
        bodyMeasurements: true,
        memberships: { orderBy: { endDate: "desc" }, take: 1 },
        streaks: true,
        challengeParticipants: true,
        dietPlan: true,
      },
    });
    if (!member) throw new AppError("Member not found", 404);

    const since30 = startOfDay();
    since30.setDate(since30.getDate() - 30);
    const att30 = member.attendances.filter((a) => new Date(a.date) >= since30).length;
    const lastAtt = member.attendances[0]?.date ?? null;
    const inactiveDays = daysSince(lastAtt);
    const workoutStreak = member.streaks.find((s) => s.type === "WORKOUT");
    const attendanceStreak = member.streaks.find((s) => s.type === "ATTENDANCE");
    const membership = member.memberships[0];
    const daysToExpiry = membership ? daysSince(membership.endDate) : null; // negative = future
    const activeChallenges = member.challengeParticipants.filter((p) => !p.isCompleted).length;

    const recs: Recommendation[] = [];

    // ── Workout ──
    if (member.workoutCompletions.length === 0) {
      recs.push({ category: "WORKOUT", title: "Start your first guided workout", description: "Log a workout this week to kick-start your progress and earn points.", confidence: 0.7 });
    } else if (att30 >= 8 && member.workoutCompletions.length < att30 / 2) {
      recs.push({ category: "WORKOUT", title: "Add a strength session", description: "You're showing up consistently — adding one strength workout can accelerate results.", confidence: 0.65 });
    }

    // ── Diet ──
    if (!member.dietPlan) {
      recs.push({ category: "DIET", title: "Get a diet plan", description: "Ask your trainer for a diet plan to complement your training.", confidence: 0.6 });
    } else if (member.dietCompletions.length < 4) {
      recs.push({ category: "DIET", title: "Log your meals", description: "Tracking meals a few times a week makes your progress much more consistent.", confidence: 0.6 });
    }

    // ── Engagement (positive framing — close to streak record) ──
    if (attendanceStreak && attendanceStreak.current > 0 && attendanceStreak.current >= attendanceStreak.longest - 2 && attendanceStreak.current < attendanceStreak.longest) {
      const away = attendanceStreak.longest - attendanceStreak.current;
      recs.push({ category: "ENGAGEMENT", title: `You're ${away} day${away === 1 ? "" : "s"} from your streak record`, description: "Keep checking in to beat your personal best!", confidence: 0.8 });
    } else if (inactiveDays !== null && inactiveDays >= 5) {
      recs.push({ category: "ENGAGEMENT", title: "Time for a comeback session", description: "A quick visit this week keeps your momentum and rewards going.", confidence: 0.7 });
    } else if (workoutStreak && workoutStreak.current >= 7) {
      recs.push({ category: "ENGAGEMENT", title: "Great consistency — keep it up!", description: `You're on a ${workoutStreak.current}-day workout streak. Stay on track for bonus points.`, confidence: 0.75 });
    }

    // ── Renewal ──
    if (daysToExpiry !== null && daysToExpiry >= -7 && daysToExpiry <= 0) {
      recs.push({ category: "RENEWAL", title: "Renew now to keep your rewards", description: "Your membership renews soon — renew to keep your streaks, points, and progress going.", confidence: 0.85 });
    }

    // ── Challenge ──
    if (activeChallenges === 0) {
      recs.push({ category: "CHALLENGE", title: "Join a challenge", description: "Members in challenges train ~30% more often. Join one to stay motivated.", confidence: 0.6 });
    }

    return recs;
  }

  /** Resolve the calling member and return their recommendations. */
  static async forCaller(user: AuthUser): Promise<Recommendation[]> {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const member = await prisma.member.findFirst({ where: { userId: user.id, gymId: user.gymId } });
    if (!member) throw new AppError("Member profile not found", 404);
    return this.forMember(user.gymId, member.id);
  }
}
