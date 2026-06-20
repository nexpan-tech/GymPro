# Referral & Rewards System — Migration Proposal (NOT EXECUTED)

Status: **AWAITING APPROVAL.** No Prisma schema was modified and no migration was run.
Everything below is **purely additive** (new optional columns, new enum values, new tables) → backward-compatible, zero data loss, preserves all existing referral/reward records and APIs.

## What already shipped WITHOUT a migration (live now)
- **Permanent per-member referral code** — deterministic `referralCodeFor(memberId)` (`REF-XXXXXX`), no column needed.
- **Registration capture** — `POST /members` accepts optional `referralCode`; validated server-side.
- **Anti-fraud** — invalid / cross-gym / self / duplicate blocked at registration (`REFERRAL_INVALID|SELF|DUPLICATE`), all reusing existing fields.
- **Mandatory success rule** — a referral becomes `CONVERTED` ONLY when the referred member activates their FIRST membership (`MembershipService.create` → `ReferralService.onFirstMembershipActivated`), awarding points + notifying the referrer.
- **Member Rewards page** — code + copy/share, lifetime progress (total/pending/successful), referral history.
- Reuses existing `Referral`, `Reward`, `RewardRedemption`, `NotificationService`, `GamificationEvents`, leaderboard.

## What REQUIRES this migration
Referral **Campaigns**, **threshold reward rules** ("Refer N → reward"), the expanded **reward type catalogue**, **dual tracking** (lifetime + campaign), `REJECTED`/`CANCELLED` referral states, dedicated **referral notification types**, and reward **inventory / category / expiry / claim** metadata.

---

## 1. Enum changes (additive values)
```prisma
enum ReferralStatus { PENDING  CONVERTED  REWARDED  EXPIRED  REJECTED  CANCELLED }   // + REJECTED, CANCELLED
enum NotificationType { /* …existing… */  REFERRAL  REWARD  CAMPAIGN }                // + 3 values
enum RewardType {
  XP  BADGE  DISCOUNT  GIFT                                                            // existing (kept)
  MEMBERSHIP_EXTENSION  MEMBERSHIP_DISCOUNT  CASH_VOUCHER  COUPON  FREE_PRODUCT
  GYM_MERCHANDISE  FREE_SESSION  NUTRITION_PRODUCT  SUPPLEMENT  CUSTOM                 // + 10 values
}
enum ReferralCampaignStatus { DRAFT  SCHEDULED  ACTIVE  COMPLETED  CANCELLED }         // NEW enum
enum RewardClaimStatus { UNLOCKED  PENDING  APPROVED  ISSUED  CLAIMED  REDEEMED  EXPIRED  REJECTED } // NEW (or reuse RedemptionStatus)
```
`ALTER TYPE … ADD VALUE` for each (additive, safe).

## 2. `Member` — optional stored code (derived code already works)
```prisma
model Member {
  // ...
  referralCode String? @unique   // optional: enables O(1) lookup + vanity codes; today it is derived
}
```

## 3. `Referral` — clean linkage + dual tracking
```prisma
model Referral {
  // ...existing fields kept...
  referredMemberId String?   // direct link (today we match on inviteeEmail)
  referredMember   Member?  @relation("MemberReferredBy", fields: [referredMemberId], references: [id])
  campaignId       String?   // dual tracking: set when eligible to a campaign
  campaign         ReferralCampaign? @relation(fields: [campaignId], references: [id])
  membershipActivatedAt DateTime?
  @@index([campaignId])
  @@index([referredMemberId])
}
```
Dual tracking: on first-membership activation, the referral updates **lifetime progress always**, and **campaign progress additionally** when registration + activation fall inside an `ACTIVE` campaign window — independent reward calculations.

## 4. NEW `ReferralCampaign`
```prisma
model ReferralCampaign {
  id          String @id @default(cuid())
  gymId       String
  gym         Gym    @relation(fields: [gymId], references: [id], onDelete: Cascade)
  createdById String
  name        String
  description String?
  bannerUrl   String?
  imageUrl    String?
  startDate   DateTime
  endDate     DateTime
  status      ReferralCampaignStatus @default(DRAFT)
  referrals   Referral[]
  rewardRules ReferralRewardRule[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([gymId])
  @@index([status])
}
```
> NOTE: the existing `Campaign` model is a **broadcast/comms** campaign — left untouched. This is a separate referral concept.

## 5. NEW `ReferralRewardRule` (threshold + rank rules; nothing hardcoded)
```prisma
model ReferralRewardRule {
  id          String @id @default(cuid())
  gymId       String
  gym         Gym    @relation(fields: [gymId], references: [id], onDelete: Cascade)
  campaignId  String?                        // null = passive (lifetime) rule
  campaign    ReferralCampaign? @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  kind        ReferralRuleKind  @default(THRESHOLD)   // THRESHOLD | TOP_REFERRER | TOP_N
  threshold   Int?                            // e.g. refer 3 / 5 / 10
  topN        Int?                            // for TOP_N
  rewardId    String
  reward      Reward @relation(fields: [rewardId], references: [id])
  autoApprove Boolean @default(false)
  isActive    Boolean @default(true)
  @@index([gymId]) @@index([campaignId])
}
enum ReferralRuleKind { THRESHOLD TOP_REFERRER TOP_N }
```

## 6. `Reward` — admin reward metadata
```prisma
model Reward {
  // ...existing kept...
  category   String?
  imageUrl   String?
  expiryDays Int?            // claim validity window
  maxClaims  Int?            // total issuance cap (null = unlimited)
  autoApprove Boolean @default(false)
  rules      ReferralRewardRule[]
}
```

## 7. NEW `ReferralRewardClaim` (claim workflow; or extend RewardRedemption)
```prisma
model ReferralRewardClaim {
  id         String @id @default(cuid())
  gymId      String
  gym        Gym    @relation(fields: [gymId], references: [id], onDelete: Cascade)
  memberId   String
  member     Member @relation(fields: [memberId], references: [id], onDelete: Cascade)
  ruleId     String
  rule       ReferralRewardRule @relation(fields: [ruleId], references: [id])
  campaignId String?
  status     RewardClaimStatus  @default(UNLOCKED)  // UNLOCKED→PENDING→APPROVED→ISSUED→CLAIMED/REDEEMED
  referralCountSnapshot Int @default(0)
  approvedById String?
  expiresAt   DateTime?
  claimedAt   DateTime?
  redeemedAt  DateTime?
  createdAt   DateTime @default(now())
  @@unique([memberId, ruleId])   // anti-abuse: one claim per rule per member
  @@index([gymId]) @@index([memberId]) @@index([campaignId])
}
```
Manual vs auto approval driven by `Reward.autoApprove` / `ReferralRewardRule.autoApprove`. The `@@unique([memberId, ruleId])` prevents duplicate reward claims at the DB level.

## 8. Back-relations to add on `Gym`/`Member`
`referralCampaigns`, `referralRewardRules`, `referralRewardClaims` on `Gym`; `referredBy Referral[]` + `referralRewardClaims` on `Member`.

---

## Safe execution plan (when approved)
1. **Neon backup branch** first (e.g. `before-referral-rewards-v1.1`), record its ID.
2. `prisma migrate diff` / `migrate dev --create-only` → **review the SQL** (only `ADD COLUMN` / `CREATE TABLE` / `ADD VALUE`, zero `DROP`).
3. `prisma generate` → `prisma migrate deploy`.
4. Rebuild backend + worker images; verify `/health/ready`.
5. Backfill: set `Member.referralCode = referralCodeFor(id)`, `Referral.referredMemberId` from invitee-email matches.

**No destructive operations. No existing column/table/enum-value removed. All existing referral/reward data and APIs preserved.**

## Code that lands AFTER approval
- Campaign CRUD + lifecycle (Draft→Scheduled→Active→Completed) + campaign window eligibility + dual-tracking writes.
- Reward-rule engine (threshold + TOP_N), unlock detection on conversion, claim workflow (auto/manual approval), inventory + expiry.
- Campaign + lifetime leaderboards, gym-admin analytics (conversion rate, top referrers, rewards issued/claimed, most-successful campaign), `REFERRAL/REWARD/CAMPAIGN` notifications, REJECTED/CANCELLED transitions.
- Web: premium Rewards page (progress rings, campaign banners + countdown, confetti on unlock), admin Reward/Campaign management. Mobile: referral QR (add `react-native-qrcode-svg`) + campaign cards. Web QR: add `qrcode.react`.
