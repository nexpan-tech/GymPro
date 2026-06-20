import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, sendEmailMock } = vi.hoisted(() => {
  const prismaMock: any = {
    member: { groupBy: vi.fn(), count: vi.fn() },
    gym: { findUnique: vi.fn(), findMany: vi.fn() },
    branch: { count: vi.fn(), groupBy: vi.fn() },
    user: { count: vi.fn(), groupBy: vi.fn() },
    saaSPlan: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    gymSubscription: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    saaSInvoice: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    auditLog: { findMany: vi.fn() },
    $transaction: vi.fn(),
  };
  const sendEmailMock = vi.fn();
  return { prismaMock, sendEmailMock };
});

vi.mock("../../config/db", () => ({ prisma: prismaMock }));
vi.mock("../../modules/email/email.service", () => ({ sendEmail: sendEmailMock }));
vi.mock("../../config/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("../../modules/reports/pdf.service", () => ({ generateSaaSInvoicePdf: vi.fn().mockResolvedValue(Buffer.from("PDF")) }));
vi.mock("../../utils/audit", () => ({ createAuditLog: vi.fn() }));
vi.mock("../../modules/super-admin/platform-settings.service", () => ({
  PlatformSettingsService: {
    get: vi.fn().mockResolvedValue({ invoicePrefix: "SAAS", dueDays: 15, defaultGstPercent: 18 }),
    snapshot: vi.fn().mockReturnValue({ companyName: "Nexpan Tech", invoiceFooter: "Thanks" }),
  },
}));

import { LicenseService, licenseTier, tierMessage } from "../../modules/license/license.service";
import { AppError } from "../../utils/response";

beforeEach(() => {
  vi.clearAllMocks();
  sendEmailMock.mockResolvedValue({ skipped: true });
  prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
  prismaMock.member.groupBy.mockResolvedValue([]);
  prismaMock.branch.count.mockResolvedValue(0);
  prismaMock.branch.groupBy.mockResolvedValue([]);
  prismaMock.user.count.mockResolvedValue(0);
  prismaMock.user.groupBy.mockResolvedValue([]);
});

describe("licenseTier — utilization thresholds", () => {
  it("maps the spec thresholds (80 / 90 / 100)", () => {
    expect(licenseTier(0)).toBe("HEALTHY");
    expect(licenseTier(79)).toBe("HEALTHY");
    expect(licenseTier(80)).toBe("APPROACHING_CAPACITY");
    expect(licenseTier(89)).toBe("APPROACHING_CAPACITY");
    expect(licenseTier(90)).toBe("UPGRADE_RECOMMENDED");
    expect(licenseTier(99)).toBe("UPGRADE_RECOMMENDED");
    expect(licenseTier(100)).toBe("FULL");
    expect(licenseTier(130)).toBe("FULL");
  });
  it("maps tier → message", () => {
    expect(tierMessage("APPROACHING_CAPACITY")).toBe("Approaching Capacity");
    expect(tierMessage("UPGRADE_RECOMMENDED")).toBe("Upgrade Recommended");
    expect(tierMessage("FULL")).toBe("License Full");
  });
});

describe("assertCapacity — license enforcement", () => {
  it("allows activation below capacity", async () => {
    prismaMock.gymSubscription.findFirst.mockResolvedValue({ id: "s1", status: "ACTIVE", plan: { name: "Scale", maxMembers: 250 } });
    prismaMock.member.count.mockResolvedValue(249);
    await expect(LicenseService.assertCapacity("g1")).resolves.toBeUndefined();
  });

  it("blocks activating member 251 on a 250 plan (LICENSE_LIMIT_REACHED, 403)", async () => {
    prismaMock.gymSubscription.findFirst.mockResolvedValue({ id: "s1", status: "ACTIVE", plan: { name: "Scale", maxMembers: 250 } });
    prismaMock.member.count.mockResolvedValue(250);
    await expect(LicenseService.assertCapacity("g1")).rejects.toMatchObject({
      statusCode: 403,
      data: { code: "LICENSE_LIMIT_REACHED", dimension: "members", capacity: 250, current: 250 },
    });
  });

  it("is a no-op for an unlicensed / uncapped gym (backward compatible)", async () => {
    prismaMock.gymSubscription.findFirst.mockResolvedValue(null);
    await expect(LicenseService.assertCapacity("g1")).resolves.toBeUndefined();
    expect(prismaMock.member.count).not.toHaveBeenCalled();
  });

  it("blocks when the license is suspended", async () => {
    prismaMock.gymSubscription.findFirst.mockResolvedValue({ id: "s1", status: "SUSPENDED", plan: { name: "Scale", maxMembers: 250 } });
    await expect(LicenseService.assertCapacity("g1")).rejects.toMatchObject({
      statusCode: 403,
      data: { code: "LICENSE_SUSPENDED" },
    });
  });
});

describe("assertBranchCapacity / assertStaffCapacity — enterprise dimensions", () => {
  it("blocks creating a 4th branch on a 3-branch plan", async () => {
    prismaMock.gymSubscription.findFirst.mockResolvedValue({ id: "s1", status: "ACTIVE", plan: { name: "Scale", maxBranches: 3, maxStaff: 15 } });
    prismaMock.branch.count.mockResolvedValue(3);
    await expect(LicenseService.assertBranchCapacity("g1")).rejects.toMatchObject({
      statusCode: 403, data: { code: "LICENSE_LIMIT_REACHED", dimension: "branches", capacity: 3 },
    });
  });
  it("allows a branch below the cap", async () => {
    prismaMock.gymSubscription.findFirst.mockResolvedValue({ id: "s1", status: "ACTIVE", plan: { name: "Scale", maxBranches: 3 } });
    prismaMock.branch.count.mockResolvedValue(2);
    await expect(LicenseService.assertBranchCapacity("g1")).resolves.toBeUndefined();
  });
  it("blocks the 16th staff seat on a 15-staff plan", async () => {
    prismaMock.gymSubscription.findFirst.mockResolvedValue({ id: "s1", status: "ACTIVE", plan: { name: "Scale", maxStaff: 15 } });
    prismaMock.user.count.mockResolvedValue(15);
    await expect(LicenseService.assertStaffCapacity("g1")).rejects.toMatchObject({
      statusCode: 403, data: { code: "LICENSE_LIMIT_REACHED", dimension: "staff", capacity: 15 },
    });
  });
  it("is a no-op for an uncapped (Elite/Enterprise) plan", async () => {
    prismaMock.gymSubscription.findFirst.mockResolvedValue({ id: "s1", status: "ACTIVE", plan: { name: "Elite", maxBranches: null, maxStaff: null } });
    await expect(LicenseService.assertBranchCapacity("g1")).resolves.toBeUndefined();
    await expect(LicenseService.assertStaffCapacity("g1")).resolves.toBeUndefined();
    expect(prismaMock.branch.count).not.toHaveBeenCalled();
  });
});

describe("getGymLicense — capacity card", () => {
  it("computes remaining + utilization% (228 / 250 = 91%, Upgrade Recommended)", async () => {
    prismaMock.gym.findUnique.mockResolvedValue({ id: "g1", name: "Iron House", email: "o@g.com", gstPercent: 18, gstNumber: null, isActive: true });
    prismaMock.gymSubscription.findFirst.mockResolvedValue({
      id: "s1", status: "ACTIVE", autoRenew: true, startDate: new Date(), endDate: new Date(Date.now() + 2.6e9),
      plan: { id: "p1", name: "Scale", maxMembers: 250, maxBranches: 3, maxStaff: 15, price: 2999, interval: "MONTHLY" },
    });
    prismaMock.member.count.mockResolvedValue(228);
    prismaMock.branch.count.mockResolvedValue(2);
    prismaMock.user.count.mockResolvedValue(12);
    prismaMock.saaSInvoice.findMany.mockResolvedValue([]);

    const card = await LicenseService.getGymLicense("g1");
    expect(card.usage.capacity).toBe(250);
    expect(card.usage.activeMembers).toBe(228);
    expect(card.usage.remaining).toBe(22);
    expect(card.usage.utilizationPct).toBe(91);
    expect(card.usage.tier).toBe("UPGRADE_RECOMMENDED");
    expect(card.usage.branches).toMatchObject({ used: 2, capacity: 3, remaining: 1 });
    expect(card.usage.staff).toMatchObject({ used: 12, capacity: 15, remaining: 3 });
    expect(card.license?.monthlyPrice).toBe(2999);
    expect(card.license?.capacity).toBe(250);
  });
});

describe("generateInvoices — FLAT license price (never per-member)", () => {
  it("bills the plan price + GST, not activeMembers × price", async () => {
    prismaMock.gymSubscription.findMany.mockResolvedValue([
      {
        id: "sub1", gymId: "g1", status: "ACTIVE",
        plan: { name: "Scale", price: 2999, maxMembers: 250 },
        gym: { id: "g1xxxxx", name: "Iron House", isActive: true, gstPercent: 18, email: "o@g.com", users: [{ email: "o@g.com" }] },
      },
    ]);
    prismaMock.saaSInvoice.findFirst.mockResolvedValue(null);
    let createdData: any = null;
    prismaMock.saaSInvoice.create.mockImplementation(async ({ data }: any) => { createdData = data; return { id: "inv1", ...data }; });
    prismaMock.saaSInvoice.update.mockImplementation(async ({ data }: any) => ({ id: "inv1", ...data }));

    const result = await LicenseService.generateInvoices("2026-06");
    expect(result.created).toBe(1);
    // Flat: 2999 + 18% GST (539.82) = 3538.82 — independent of member count.
    expect(createdData.amount).toBe(2999);
    expect(createdData.gstAmount).toBe(539.82);
    expect(createdData.totalAmount).toBe(3538.82);
    expect(createdData.pricePerMember).toBeNull();
    expect(result.invoices[0].totalAmount).toBe(3538.82);
    expect(result.invoices[0].monthlyPrice).toBe(2999);
  });

  it("is idempotent — skips a gym already invoiced for the month", async () => {
    prismaMock.gymSubscription.findMany.mockResolvedValue([
      { id: "sub1", gymId: "g1", status: "ACTIVE", plan: { name: "Scale", price: 2999 }, gym: { id: "g1", name: "Iron", isActive: true, gstPercent: 18, email: "o@g.com", users: [] } },
    ]);
    prismaMock.saaSInvoice.findFirst.mockResolvedValue({ id: "existing" });
    const result = await LicenseService.generateInvoices("2026-06");
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(prismaMock.saaSInvoice.create).not.toHaveBeenCalled();
  });
});

describe("assignPlan — upgrade supersedes prior license", () => {
  it("retires the old subscription and records an UPGRADE", async () => {
    prismaMock.gym.findUnique.mockResolvedValue({ id: "g1", name: "Iron" });
    prismaMock.saaSPlan.findFirst.mockResolvedValue({ id: "elite", name: "Elite", price: 4999, interval: "MONTHLY", maxMembers: 500 });
    // current subscription = Scale (cheaper) → moving to Elite is an UPGRADE
    prismaMock.gymSubscription.findFirst.mockResolvedValue({ id: "old", status: "ACTIVE", plan: { name: "Scale", price: 2999 } });
    prismaMock.gymSubscription.update.mockResolvedValue({ id: "old", status: "CANCELLED" });
    prismaMock.gymSubscription.create.mockResolvedValue({ id: "new", planId: "elite", status: "ACTIVE", plan: { name: "Elite", price: 4999, maxMembers: 500 } });

    const result = await LicenseService.assignPlan("g1", { planId: "elite" });
    expect(prismaMock.gymSubscription.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "old" }, data: { status: "CANCELLED" } }));
    expect(result.plan.name).toBe("Elite");
  });
});

it("AppError carries machine-readable license code in data", () => {
  const e = new AppError("nope", 403, { code: "LICENSE_LIMIT_REACHED" });
  expect(e.statusCode).toBe(403);
  expect((e.data as any).code).toBe("LICENSE_LIMIT_REACHED");
});
