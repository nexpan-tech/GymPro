/**
 * GymPro — SAFE production-data cleanup.
 *
 * Deletes ALL user-generated / demo / test data (every row in every data table)
 * while PRESERVING the schema, migration history, the feature-flag catalogue,
 * and recreating one SUPER_ADMIN.
 *
 * It does NOT touch the schema or migrations — only rows.
 *
 * USAGE (the guard is mandatory):
 *   CONFIRM_CLEANUP=YES npx tsx prisma/cleanup-demo-data.ts
 *   # or
 *   CONFIRM_CLEANUP=YES pnpm cleanup:demo-data
 *
 * Optional overrides:
 *   SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Feature-flag catalogue to (re)seed — kept in sync with the app's catalogue.
const FEATURE_CATALOGUE = [
  { key: "gamification", label: "Gamification", category: "Engagement", description: "Points, streaks, badges, leaderboards." },
  { key: "crm", label: "CRM & Leads", category: "Growth", description: "Lead pipeline, trials, conversion." },
  { key: "community", label: "Community & Challenges", category: "Community", description: "Groups and challenges." },
  { key: "chat", label: "Trainer Chat", category: "Communication", description: "Trainer-member messaging." },
  { key: "ai", label: "AI Insights", category: "Intelligence", description: "Recommendations, forecasts, insights." },
  { key: "billing", label: "Billing & Payments", category: "Billing", description: "Member billing and invoices." },
  { key: "progress", label: "Progress Tracking", category: "Core", description: "Body measurements and goals." },
];

/**
 * Deletion order: child / dependent tables FIRST, parents LAST, so foreign-key
 * constraints never block a delete. `model` is the Prisma client property name.
 * FeatureFlag is intentionally absent — it is preserved + reseeded below.
 */
const DELETE_ORDER: { model: string; label: string }[] = [
  // ── Communication / realtime (Stage 9) ──
  { model: "announcementReceipt", label: "AnnouncementReceipt" },
  { model: "deliveryLog", label: "DeliveryLog" },
  { model: "notification", label: "Notification" },
  { model: "trainerMessage", label: "TrainerMessage" },
  { model: "trainerFeedback", label: "TrainerFeedback" },
  // ── Gamification (Stage 8) ──
  { model: "pointTransaction", label: "PointTransaction" },
  { model: "rewardRedemption", label: "RewardRedemption" },
  { model: "memberStreak", label: "MemberStreak" },
  { model: "memberXP", label: "MemberXP" },
  { model: "memberBadge", label: "MemberBadge" },
  { model: "missionCompletion", label: "MissionCompletion" },
  { model: "challengeParticipant", label: "ChallengeParticipant" },
  { model: "communityGroupMember", label: "CommunityGroupMember" },
  // ── Workout / diet / progress (Stages 4–5) ──
  { model: "workoutCompletion", label: "WorkoutCompletion" },
  { model: "dietCompletion", label: "DietCompletion" },
  { model: "workoutExercise", label: "WorkoutExercise" },
  { model: "dietMeal", label: "DietMeal" },
  { model: "bodyMeasurement", label: "BodyMeasurement" },
  { model: "goal", label: "Goal" },
  // ── CRM / retention / trials (Stage 7) ──
  { model: "leadActivity", label: "LeadActivity" },
  { model: "trialMembership", label: "TrialMembership" },
  { model: "referral", label: "Referral" },
  // ── Attendance + billing (Stages 3 + 6) ──
  { model: "attendance", label: "Attendance" },
  { model: "invoice", label: "Invoice" },
  { model: "payment", label: "Payment" },
  { model: "due", label: "Due" },
  { model: "saaSInvoice", label: "SaaSInvoice" },
  // ── Multi-branch / flags ──
  { model: "regionalManagerBranch", label: "RegionalManagerBranch" },
  { model: "featureFlagAssignment", label: "FeatureFlagAssignment" },
  // ── Parents of the above ──
  { model: "announcement", label: "Announcement" },
  { model: "challenge", label: "Challenge" },
  { model: "communityGroup", label: "CommunityGroup" },
  { model: "dailyMission", label: "DailyMission" },
  { model: "reward", label: "Reward" },
  { model: "workoutPlan", label: "WorkoutPlan" },
  { model: "dietPlan", label: "DietPlan" },
  { model: "campaign", label: "Campaign" },
  { model: "lead", label: "Lead" },
  { model: "membership", label: "Membership" },
  { model: "gymMembershipPlan", label: "GymMembershipPlan" },
  { model: "badge", label: "Badge" },
  { model: "whiteLabelSetting", label: "WhiteLabelSetting" },
  { model: "gymSubscription", label: "GymSubscription" },
  { model: "saaSPlan", label: "SaaSPlan" },
  { model: "webhookEndpoint", label: "WebhookEndpoint" },
  { model: "integration", label: "Integration" },
  { model: "apiKey", label: "ApiKey" },
  { model: "marketplaceItem", label: "MarketplaceItem" },
  // ── Sessions / devices / audit ──
  { model: "deviceSession", label: "DeviceSession" },
  { model: "deviceToken", label: "DeviceToken" },
  { model: "session", label: "Session" },
  { model: "auditLog", label: "AuditLog" },
  // ── Reference + roots (order matters: member → user → branch → gym) ──
  { model: "exercise", label: "Exercise" },
  { model: "member", label: "Member" },
  { model: "user", label: "User" },
  { model: "branch", label: "Branch" },
  { model: "gym", label: "Gym" },
];

async function main() {
  if (process.env.CONFIRM_CLEANUP !== "YES") {
    console.error("\n🛑 Refusing to run: destructive cleanup is guarded.\n");
    console.error("   This deletes ALL data (schema/migrations are preserved).");
    console.error("   Re-run with the confirmation flag:\n");
    console.error("   CONFIRM_CLEANUP=YES npx tsx prisma/cleanup-demo-data.ts\n");
    process.exit(1);
  }

  const email = process.env.SUPER_ADMIN_EMAIL || "superadmin@gympro.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "Admin@123";
  const name = process.env.SUPER_ADMIN_NAME || "Super Admin";

  console.log("\n🧹 GymPro demo-data cleanup starting…\n");
  const results: { table: string; deleted: number }[] = [];

  for (const { model, label } of DELETE_ORDER) {
    const client = (prisma as unknown as Record<string, { deleteMany: (a: object) => Promise<{ count: number }> }>)[model];
    if (!client) {
      console.warn(`⚠️  Unknown model "${model}" — skipped`);
      continue;
    }
    try {
      const { count } = await client.deleteMany({});
      results.push({ table: label, deleted: count });
      console.log(`  deleted ${String(count).padStart(6)}  ${label}`);
    } catch (err) {
      console.error(`❌  Failed deleting ${label}:`, err instanceof Error ? err.message : err);
      throw err;
    }
  }

  // ── Recreate SUPER_ADMIN ──
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.SUPER_ADMIN, isActive: true, gymId: null },
    create: { name, email, passwordHash, role: Role.SUPER_ADMIN, isActive: true, gymId: null },
  });

  // ── (Re)seed the feature-flag catalogue ──
  for (const f of FEATURE_CATALOGUE) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      update: { label: f.label, category: f.category, description: f.description },
      create: { key: f.key, label: f.label, category: f.category, description: f.description, defaultEnabled: true },
    });
  }

  // ── Summary ──
  const totalDeleted = results.reduce((s, r) => s + r.deleted, 0);
  const [gymCount, userCount, flagCount] = await Promise.all([
    prisma.gym.count(),
    prisma.user.count(),
    prisma.featureFlag.count(),
  ]);

  console.log("\n──────────────────────────────────────────────");
  console.log(`✅ Cleanup complete — ${totalDeleted} rows deleted across ${results.length} tables.`);
  console.log("Preserved: schema, migrations, feature-flag catalogue.");
  console.log(`Re-created SUPER_ADMIN: ${email} (password: ${password})`);
  console.log("\nRemaining:");
  console.log(`  Gyms:          ${gymCount}`);
  console.log(`  Users:         ${userCount}  (expected 1 — the super admin)`);
  console.log(`  Feature flags: ${flagCount}`);
  console.log("──────────────────────────────────────────────\n");

  if (gymCount !== 0 || userCount !== 1) {
    console.warn("⚠️  Verification warning: expected 0 gyms and exactly 1 user (super admin).");
  } else {
    console.log("🟢 Verification OK: 0 gyms, 1 super-admin user.");
  }
}

main()
  .catch((error) => {
    console.error("\n💥 Cleanup aborted:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
