# Enterprise License System — Migration Proposal (NOT EXECUTED)

Status: **AWAITING APPROVAL.** No Prisma schema was modified and no migration was run.
Per project policy, this document is the complete, additive schema change set required to finish the Enterprise License Architecture. Everything here is **purely additive** (new optional columns, new enum value, new tables) → backward-compatible, zero data loss, preserves all invoice history and existing APIs.

## What already shipped WITHOUT a migration (live now)
- **Member capacity** enforcement (existing `SaaSPlan.maxMembers`).
- **Branch capacity** enforcement (existing `SaaSPlan.maxBranches`) — `LicenseService.assertBranchCapacity` in `BranchService.create`.
- **Staff capacity** enforcement (existing aggregate `SaaSPlan.maxStaff`) — `LicenseService.assertStaffCapacity` in `createUser`.
- **License utilization** for members + branches + staff (super-admin grid, gym-admin card).
- **Plan comparison matrix** (members/branches/staff/price).
- **Feature flags** already exist per-gym (`FeatureFlag` + `FeatureFlagAssignment` + `requireFeature` middleware) — usable today; can be driven by plan tier in code without schema.

## What REQUIRES this migration
Storage limits + usage, AI/SMS/WhatsApp limits + monthly usage counters, purchasable add-ons, per-role staff caps, API-access + white-label flags, the `GRACE_PERIOD` license state, and super-admin overrides (free/internal/demo/unlimited/temporary).

---

## 1. Enum change (additive value)

```prisma
enum GymSubscriptionStatus {
  ACTIVE
  TRIALING
  GRACE_PERIOD   // NEW — temporary access window before suspension
  PAST_DUE
  SUSPENDED
  CANCELLED
  EXPIRED
}
```
Postgres: `ALTER TYPE "GymSubscriptionStatus" ADD VALUE 'GRACE_PERIOD';` (additive, safe; cannot run inside a txn — Prisma handles this).

## 2. `SaaSPlan` — new optional columns (all nullable → `null` = unlimited)

```prisma
model SaaSPlan {
  // ... existing fields unchanged ...
  // Per-role staff caps (aggregate maxStaff stays as fallback)
  maxAdmins        Int?
  maxTrainers      Int?
  maxReceptionists Int?
  // Resource caps
  maxStorageGB     Int?     // null = unlimited
  maxAiRequests    Int?     // monthly
  maxSms           Int?     // monthly
  maxWhatsapp      Int?     // monthly
  // Capability flags
  apiAccess        Boolean @default(false)
  whiteLabel       Boolean @default(false)
  // Feature gating per plan (keys map to existing FeatureFlag.key)
  features         String[] @default([])
  trialDays        Int     @default(0)
  gracePeriodDays  Int     @default(7)
}
```

## 3. `GymSubscription` — override + grace columns (all optional)

```prisma
model GymSubscription {
  // ... existing fields unchanged ...
  graceUntil    DateTime?      // when GRACE_PERIOD ends → auto-suspend
  // Super-admin overrides (every change is also written to AuditLog)
  overrideMaxMembers   Int?
  overrideMaxBranches  Int?
  overrideMaxStaff     Int?
  overrideStorageGB    Int?
  overrideExpiresAt    DateTime?
  licenseKind   LicenseKind @default(STANDARD) // STANDARD | INTERNAL | DEMO | FREE | UNLIMITED
  notes         String?
}

enum LicenseKind { STANDARD INTERNAL DEMO FREE UNLIMITED }
```
`UNLIMITED`/`INTERNAL`/`DEMO`/`FREE` short-circuit all capacity checks (emergency unlock / internal / demo licenses). Effective cap = `override?? addonSum + plan.maxX`.

## 4. NEW `LicenseAddon` — purchasable add-ons (extend limits, never mutate base plan)

```prisma
model LicenseAddon {
  id             String   @id @default(cuid())
  gymId          String
  gym            Gym      @relation(fields: [gymId], references: [id], onDelete: Cascade)
  subscriptionId String?
  subscription   GymSubscription? @relation(fields: [subscriptionId], references: [id])
  type           AddonType            // MEMBERS | BRANCHES | STAFF | STORAGE_GB | SMS | AI | WHATSAPP | API | WHITE_LABEL
  quantity       Int      @default(0) // e.g. +100 members, +10 GB
  priceMonthly   Float    @default(0)
  active         Boolean  @default(true)
  startsAt       DateTime @default(now())
  expiresAt      DateTime?
  createdAt      DateTime @default(now())
  @@index([gymId])
  @@index([type])
}
enum AddonType { MEMBERS BRANCHES STAFF STORAGE_GB SMS AI WHATSAPP API WHITE_LABEL }
```
Effective limit per dimension = `plan.maxX + Σ active addons of that type` (overrides win if set). Capacity checks in `LicenseService` read this composite.

## 5. NEW `LicenseUsage` — monthly metered usage (AI/SMS/WhatsApp/storage + peaks)

```prisma
model LicenseUsage {
  id          String   @id @default(cuid())
  gymId       String
  gym         Gym      @relation(fields: [gymId], references: [id], onDelete: Cascade)
  period      String                  // "YYYY-MM"
  aiRequests  Int      @default(0)
  sms         Int      @default(0)
  whatsapp    Int      @default(0)
  storageBytes BigInt  @default(0)     // current snapshot
  peakActiveMembers Int @default(0)
  peakBranches      Int @default(0)
  peakStaff         Int @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@unique([gymId, period])           // one row per gym per month → resets monthly
  @@index([gymId])
}
```
AI/SMS/WhatsApp increment this row (atomic `upsert` + `increment`) and check the composite limit before sending. Resets naturally each month (new period row).

## 6. NEW `StorageObject` — storage accounting (there is no upload model today)

```prisma
model StorageObject {
  id        String   @id @default(cuid())
  gymId     String
  gym       Gym      @relation(fields: [gymId], references: [id], onDelete: Cascade)
  kind      String                 // MEMBER_PHOTO | PROGRESS_PHOTO | EXERCISE_VIDEO | DOCUMENT | ATTACHMENT
  url       String
  sizeBytes BigInt   @default(0)
  createdAt DateTime @default(now())
  @@index([gymId])
}
```
Storage used = `SUM(sizeBytes)` per gym (also mirrored into `LicenseUsage.storageBytes` for fast reads). Warn at 80/90/100% like other dimensions.

## 7. Back-relations to add on `Gym` (and `GymSubscription`)
`addons LicenseAddon[]`, `usage LicenseUsage[]`, `storageObjects StorageObject[]` on `Gym`; `addons LicenseAddon[]` on `GymSubscription`.

---

## Safe execution plan (when approved) — same process as the Personal Plans migration
1. **Neon backup branch** first (e.g. `before-enterprise-license-v1.1`), record its ID.
2. `prisma migrate diff` / `migrate dev --create-only` to generate the additive SQL → **review the SQL** (must be only `ADD COLUMN`/`CREATE TABLE`/`ADD VALUE`, zero `DROP`).
3. `prisma generate`, then `prisma migrate deploy` (DB is now `_prisma_migrations`-managed).
4. Rebuild backend + worker Docker images; verify `/health/ready`.
5. Backfill: one `StorageObject` sweep (optional), seed default plan caps.

**No destructive operations. No existing column/table/enum-value removed. All existing APIs and invoice history preserved.**

## Code that lands AFTER approval (depends on the above)
- `LicenseService`: composite limit resolver (plan + add-ons + overrides), AI/SMS/WhatsApp meter guards, storage accounting, grace-period transitions, super-admin override endpoints (+ AuditLog on every override).
- Jobs: monthly usage reset is implicit (period rows); grace→suspend cron; renewal reminders.
- Web: Enterprise dashboard with storage/AI/SMS/WhatsApp rings, add-on management, override panel, feature-flag-per-plan editor.
