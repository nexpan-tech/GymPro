import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = { id: string; role: string; gymId: string | null };

/** Stage 10 — platform feature catalogue. Defaults are seeded on first use. */
export const FEATURE_CATALOGUE: { key: string; label: string; category: string; description: string }[] = [
  { key: "gamification", label: "Gamification", category: "Engagement", description: "Points, streaks, badges, leaderboards." },
  { key: "crm", label: "CRM & Leads", category: "Growth", description: "Lead pipeline, trials, conversion." },
  { key: "community", label: "Community & Challenges", category: "Community", description: "Groups and challenges." },
  { key: "chat", label: "Trainer Chat", category: "Communication", description: "Trainer-member messaging." },
  { key: "ai", label: "AI Insights", category: "Intelligence", description: "Recommendations, forecasts, insights." },
  { key: "billing", label: "Billing & Payments", category: "Billing", description: "Member billing and invoices." },
  { key: "progress", label: "Progress Tracking", category: "Core", description: "Body measurements and goals." },
];

export class FeatureFlagService {
  /** Idempotently ensure the catalogue exists. */
  static async seed() {
    for (const f of FEATURE_CATALOGUE) {
      await prisma.featureFlag.upsert({
        where: { key: f.key },
        update: { label: f.label, category: f.category, description: f.description },
        create: { key: f.key, label: f.label, category: f.category, description: f.description, defaultEnabled: true },
      });
    }
    return prisma.featureFlag.findMany({ orderBy: { category: "asc" } });
  }

  static async catalogue() {
    const flags = await prisma.featureFlag.findMany({ orderBy: { category: "asc" } });
    return flags.length ? flags : this.seed();
  }

  /** Effective flags for a gym (assignment override else default). */
  static async effectiveForGym(gymId: string) {
    const [flags, assignments] = await Promise.all([
      this.catalogue(),
      prisma.featureFlagAssignment.findMany({ where: { gymId } }),
    ]);
    const byKey = new Map(assignments.map((a) => [a.flagKey, a.enabled]));
    return flags.map((f) => ({
      key: f.key,
      label: f.label,
      category: f.category,
      description: f.description,
      enabled: byKey.has(f.key) ? (byKey.get(f.key) as boolean) : f.defaultEnabled,
      overridden: byKey.has(f.key),
    }));
  }

  /** The caller's own gym flags (for UI gating). */
  static async forCaller(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    return this.effectiveForGym(user.gymId);
  }

  /** Super-admin: set a per-gym override. */
  static async setForGym(gymId: string, flagKey: string, enabled: boolean) {
    const flag = await prisma.featureFlag.findUnique({ where: { key: flagKey } });
    if (!flag) throw new AppError("Unknown feature flag", 404);
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new AppError("Gym not found", 404);
    return prisma.featureFlagAssignment.upsert({
      where: { flagKey_gymId: { flagKey, gymId } },
      update: { enabled },
      create: { flagKey, gymId, enabled },
    });
  }
}

/**
 * Helper used anywhere to gate behaviour. Unknown flags / no gym = enabled
 * (fail-open) so flags never break existing flows — they only DISABLE on an
 * explicit `enabled:false` assignment or `defaultEnabled:false`.
 */
export async function featureEnabled(gymId: string | null | undefined, key: string): Promise<boolean> {
  if (!gymId) return true;
  const assignment = await prisma.featureFlagAssignment.findUnique({
    where: { flagKey_gymId: { flagKey: key, gymId } },
  });
  if (assignment) return assignment.enabled;
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  return flag ? flag.defaultEnabled : true;
}
