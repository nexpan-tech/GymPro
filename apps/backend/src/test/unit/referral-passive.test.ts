import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, referralConvertedMock, notifyMock } = vi.hoisted(() => {
  const prismaMock: any = {
    member: { findFirst: vi.fn() },
    referral: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  };
  return { prismaMock, referralConvertedMock: vi.fn(), notifyMock: vi.fn() };
});

vi.mock("../../config/db", () => ({ prisma: prismaMock }));
vi.mock("../../config/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("../../modules/notification/notification.service", () => ({ NotificationService: { create: notifyMock } }));
vi.mock("../../modules/gamification/engagement-events.service", () => ({ GamificationEvents: { referralConverted: referralConvertedMock } }));
vi.mock("../../modules/gamification/points.service", () => ({ POINT_RULES: { REFERRAL_CONVERTED: 50 } }));

import { ReferralService, referralCodeFor, findMemberByReferralCode } from "../../modules/referral/referral.service";

// id whose last-6 chars yield code REF-AAA111
const REFERRER = { id: "refmemberaaa111", user: { id: "u1", email: "ann@x.com", name: "Ann" } };

beforeEach(() => {
  vi.clearAllMocks();
  notifyMock.mockResolvedValue(undefined);
  referralConvertedMock.mockResolvedValue({ awarded: true });
  prismaMock.referral.create.mockImplementation(async ({ data }: any) => ({ id: "r1", ...data }));
  prismaMock.referral.update.mockImplementation(async ({ data }: any) => ({ id: "r1", ...data }));
});

describe("referralCodeFor — deterministic & permanent", () => {
  it("derives a stable REF- code from the member id", () => {
    expect(referralCodeFor("refmemberaaa111")).toBe("REF-AAA111");
    expect(referralCodeFor("refmemberaaa111")).toBe(referralCodeFor("refmemberaaa111")); // stable
  });
});

describe("findMemberByReferralCode", () => {
  it("resolves a code to its owning member in the same gym", async () => {
    prismaMock.member.findFirst.mockResolvedValue(REFERRER);
    const m = await findMemberByReferralCode("g1", "REF-AAA111");
    expect(m?.id).toBe("refmemberaaa111");
    expect(prismaMock.member.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { gymId: "g1", id: { endsWith: "aaa111" } } }));
  });
  it("returns null for a non-matching code", async () => {
    prismaMock.member.findFirst.mockResolvedValue(null);
    expect(await findMemberByReferralCode("g1", "REF-ZZZZZZ")).toBeNull();
  });
});

describe("resolveReferrerForRegistration — anti-fraud", () => {
  it("rejects an invalid / cross-gym code", async () => {
    prismaMock.member.findFirst.mockResolvedValue(null);
    await expect(ReferralService.resolveReferrerForRegistration("g1", "REF-ZZZZZZ", "new@x.com"))
      .rejects.toMatchObject({ statusCode: 400, data: { code: "REFERRAL_INVALID" } });
  });
  it("rejects self-referral", async () => {
    prismaMock.member.findFirst.mockResolvedValue(REFERRER);
    await expect(ReferralService.resolveReferrerForRegistration("g1", "REF-AAA111", "ann@x.com"))
      .rejects.toMatchObject({ statusCode: 400, data: { code: "REFERRAL_SELF" } });
  });
  it("rejects a duplicate referral (invitee already referred)", async () => {
    prismaMock.member.findFirst.mockResolvedValue(REFERRER);
    prismaMock.referral.findFirst.mockResolvedValue({ id: "existing" });
    await expect(ReferralService.resolveReferrerForRegistration("g1", "REF-AAA111", "new@x.com"))
      .rejects.toMatchObject({ statusCode: 400, data: { code: "REFERRAL_DUPLICATE" } });
  });
  it("accepts a valid referral", async () => {
    prismaMock.member.findFirst.mockResolvedValue(REFERRER);
    prismaMock.referral.findFirst.mockResolvedValue(null);
    const r = await ReferralService.resolveReferrerForRegistration("g1", "REF-AAA111", "new@x.com");
    expect(r.id).toBe("refmemberaaa111");
  });
});

describe("recordPendingReferral — registration never completes a referral", () => {
  it("creates a PENDING referral and notifies the referrer", async () => {
    const r = await ReferralService.recordPendingReferral("g1", REFERRER, { id: "m2", name: "Bob", email: "new@x.com", phone: "999" });
    expect(prismaMock.referral.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ gymId: "g1", referrerId: "refmemberaaa111", status: "PENDING", inviteeEmail: "new@x.com" }),
    }));
    expect((r as any).status).toBe("PENDING");
    expect(notifyMock).toHaveBeenCalled();
  });
});

describe("onFirstMembershipActivated — the mandatory success rule", () => {
  it("marks the pending referral CONVERTED + awards points on first membership", async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: "m2", user: { email: "new@x.com", name: "Bob" } });
    prismaMock.referral.findFirst.mockResolvedValue({ id: "r1", referrerId: "refmemberaaa111", status: "PENDING" });
    const updated = await ReferralService.onFirstMembershipActivated("g1", "m2");
    expect(prismaMock.referral.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "r1" }, data: expect.objectContaining({ status: "CONVERTED", rewardPoints: 50 }),
    }));
    expect(referralConvertedMock).toHaveBeenCalledWith(expect.objectContaining({ referralId: "r1", memberId: "refmemberaaa111" }));
    expect((updated as any).status).toBe("CONVERTED");
  });
  it("is a no-op when the member has no pending referral", async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: "m3", user: { email: "solo@x.com" } });
    prismaMock.referral.findFirst.mockResolvedValue(null);
    expect(await ReferralService.onFirstMembershipActivated("g1", "m3")).toBeNull();
    expect(prismaMock.referral.update).not.toHaveBeenCalled();
  });
});
