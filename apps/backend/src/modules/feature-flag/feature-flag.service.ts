import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = { id: string; role: string; gymId: string | null };

/**
 * Platform feature catalogue. Defaults are seeded on first use and are
 * idempotently upserted by key, so this list can grow safely over releases
 * without touching the schema. Keys here are the contract used by
 * `featureEnabled()` / `requireFeature()` (backend) and the web sidebar gating.
 */
export const FEATURE_CATALOGUE: { key: string; label: string; category: string; description: string }[] = [
  // Engagement
  { key: "gamification", label: "Gamification & Rewards", category: "Engagement", description: "Points, streaks, badges and reward redemptions." },
  { key: "leaderboard", label: "Leaderboard", category: "Engagement", description: "Gym, branch and challenge leaderboards." },
  { key: "community", label: "Community & Challenges", category: "Engagement", description: "Community groups and challenges." },
  { key: "referral", label: "Referral System", category: "Engagement", description: "Member referral codes, rewards and tracking." },
  { key: "goals", label: "Goals", category: "Engagement", description: "Member goal setting and tracking." },
  // Growth & Intelligence
  { key: "crm", label: "CRM & Leads", category: "Growth", description: "Lead pipeline, trials and conversion." },
  { key: "retention", label: "Retention & Churn", category: "Growth", description: "Risk scoring, churn and renewal predictions." },
  { key: "automation", label: "Automation", category: "Growth", description: "Automated campaigns and lifecycle workflows." },
  { key: "ai", label: "AI Insights", category: "Intelligence", description: "Recommendations, forecasts and insights." },
  { key: "analytics", label: "Analytics", category: "Intelligence", description: "Dashboards and analytics across the gym." },
  { key: "reports", label: "Reports", category: "Intelligence", description: "Standard exportable reports." },
  { key: "advanced-reports", label: "Advanced Reports", category: "Intelligence", description: "Custom and scheduled advanced reporting." },
  // Programs
  { key: "workout-builder", label: "Workout Builder", category: "Programs", description: "Build and assign workout plans." },
  { key: "diet-builder", label: "Diet Builder", category: "Programs", description: "Build and assign diet plans." },
  { key: "personal-plans", label: "Personal Plans", category: "Programs", description: "Per-member personalised workout and diet plans." },
  { key: "progress", label: "Progress Tracking", category: "Programs", description: "Body measurements and progress charts." },
  // Communication
  { key: "chat", label: "Chat", category: "Communication", description: "Trainer-member and admin messaging." },
  { key: "announcements", label: "Announcements & Broadcast", category: "Communication", description: "Targeted announcements and broadcasts." },
  // Billing & Platform
  { key: "billing", label: "Billing & Payments", category: "Billing", description: "Member billing, invoices and payments." },
  { key: "white-label", label: "White Label", category: "Platform", description: "Custom branding and white-labelling." },
  { key: "api-access", label: "API Access", category: "Platform", description: "Programmatic API access for the gym." },
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
    // Idempotently backfill any catalogue entries missing from the DB (e.g. new
    // features added in a release) so the catalogue is always complete without a
    // manual re-seed. Additive only — never edits/removes existing flags.
    const have = new Set(flags.map((f) => f.key));
    const missing = FEATURE_CATALOGUE.filter((f) => !have.has(f.key));
    if (missing.length === 0) return flags;
    await prisma.featureFlag.createMany({
      data: missing.map((f) => ({ key: f.key, label: f.label, category: f.category, description: f.description, defaultEnabled: true })),
      skipDuplicates: true,
    });
    return prisma.featureFlag.findMany({ orderBy: { category: "asc" } });
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

  /** Super-admin: full management list with per-flag override counts. */
  static async listAll() {
    const flags = await prisma.featureFlag.findMany({
      orderBy: [{ category: "asc" }, { label: "asc" }],
      include: { assignments: { select: { enabled: true } } },
    });
    return flags.map((f) => {
      const overrides = f.assignments.length;
      const enabledOverrides = f.assignments.filter((a) => a.enabled).length;
      return {
        id: f.id,
        key: f.key,
        label: f.label,
        description: f.description,
        category: f.category,
        defaultEnabled: f.defaultEnabled,
        rolloutPercentage: (f as { rolloutPercentage?: number | null }).rolloutPercentage ?? null,
        environment: (f as { environment?: string | null }).environment ?? null,
        isActive: (f as { isActive?: boolean }).isActive ?? true,
        overrides,
        enabledOverrides,
        disabledOverrides: overrides - enabledOverrides,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      };
    });
  }

  /** Super-admin: create a new feature flag (slug key, unique). */
  static async createFlag(data: any) {
    const key = String(data.key ?? "").trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(key)) {
      throw new AppError("Key must be slug format (lowercase letters, numbers, hyphens)", 400);
    }
    if (!data.label || String(data.label).trim().length < 2) {
      throw new AppError("A label is required", 400);
    }
    const existing = await prisma.featureFlag.findUnique({ where: { key } });
    if (existing) throw new AppError("A feature flag with this key already exists", 400);

    return prisma.featureFlag.create({
      data: {
        key,
        label: String(data.label).trim(),
        description: data.description ?? null,
        category: data.category ?? null,
        defaultEnabled: data.defaultEnabled ?? true,
        rolloutPercentage:
          data.rolloutPercentage != null ? Math.max(0, Math.min(100, Number(data.rolloutPercentage))) : null,
        environment: data.environment ?? null,
        isActive: data.isActive ?? true,
      } as any,
    });
  }

  /** Super-admin: edit a flag's metadata / global default / rollout. */
  static async updateFlag(key: string, data: any) {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) throw new AppError("Feature flag not found", 404);
    return prisma.featureFlag.update({
      where: { key },
      data: {
        label: data.label != null ? String(data.label).trim() : undefined,
        description: data.description != null ? data.description : undefined,
        category: data.category != null ? data.category : undefined,
        defaultEnabled: typeof data.defaultEnabled === "boolean" ? data.defaultEnabled : undefined,
        rolloutPercentage:
          data.rolloutPercentage !== undefined
            ? data.rolloutPercentage == null
              ? null
              : Math.max(0, Math.min(100, Number(data.rolloutPercentage)))
            : undefined,
        environment: data.environment !== undefined ? data.environment : undefined,
        isActive: typeof data.isActive === "boolean" ? data.isActive : undefined,
      } as any,
    });
  }

  /**
   * Super-admin: safely deactivate a flag (soft delete). We do NOT hard-delete
   * so runtime `featureEnabled()` checks and audit history stay intact.
   */
  static async deleteFlag(key: string) {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) throw new AppError("Feature flag not found", 404);
    return prisma.featureFlag.update({ where: { key }, data: { isActive: false } as any });
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
