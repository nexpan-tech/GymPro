import { describe, it, expect, vi, beforeEach } from "vitest";

// Regression guard for the runtime 500 sprint: a brand-new platform (empty
// SaaSInvoice table, no PlatformBillingSettings row, gyms with no invoices yet)
// must return clean empty arrays / lazily-created defaults — never throw.

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    member: { groupBy: vi.fn() },
    gym: { findMany: vi.fn() },
    platformBillingSettings: { findFirst: vi.fn(), create: vi.fn() },
    saaSInvoice: { findMany: vi.fn() },
  } as any,
}));

vi.mock("../../config/db", () => ({ prisma: prismaMock }));
vi.mock("../../modules/email/email.service", () => ({ sendEmail: vi.fn() }));
vi.mock("../../config/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("../../modules/reports/pdf.service", () => ({ generateSaaSInvoicePdf: vi.fn() }));
vi.mock("../../utils/audit", () => ({ createAuditLog: vi.fn() }));
vi.mock("../../modules/super-admin/revenue.service", () => ({
  RevenueSummaryService: { summary: vi.fn() },
}));

import { SaaSBillingService } from "../../modules/super-admin/saas-billing.service";
import { PlatformSettingsService } from "../../modules/super-admin/platform-settings.service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SaaSBillingService.subscriptions — empty / legacy data", () => {
  it("returns [] when there are no gyms (empty platform)", async () => {
    prismaMock.gym.findMany.mockResolvedValue([]);
    prismaMock.member.groupBy.mockResolvedValue([]);
    prismaMock.saaSInvoice.findMany.mockResolvedValue([]);

    const rows = await SaaSBillingService.subscriptions();
    expect(rows).toEqual([]);
  });

  it("does not throw for a gym with no invoices — reports NOT_BILLED", async () => {
    prismaMock.gym.findMany.mockResolvedValue([
      { id: "g1", name: "Gym One", email: "g1@x.com", gstPercent: 18, pricePerActiveMember: 20, isActive: true, users: [] },
    ]);
    prismaMock.member.groupBy.mockResolvedValue([{ gymId: "g1", _count: { _all: 5 } }]);
    prismaMock.saaSInvoice.findMany.mockResolvedValue([]); // none billed yet

    const [row] = await SaaSBillingService.subscriptions();
    expect(row.billingStatus).toBe("NOT_BILLED");
    expect(row.latestInvoice).toBeNull();
    expect(row.monthlyAmount).toBe(118); // 5 × 20 = 100 +18% = 118
    expect(row.ownerEmail).toBe("g1@x.com"); // falls back to gym email when no ADMIN user
    expect(row.pendingAmount).toBe(0);
  });
});

describe("SaaSBillingService.listInvoices — empty table", () => {
  it("returns [] when no invoices exist", async () => {
    prismaMock.saaSInvoice.findMany.mockResolvedValue([]);
    const rows = await SaaSBillingService.listInvoices();
    expect(rows).toEqual([]);
  });
});

describe("PlatformSettingsService.get — missing settings row", () => {
  it("lazily creates a default row when none exists", async () => {
    prismaMock.platformBillingSettings.findFirst.mockResolvedValue(null);
    prismaMock.platformBillingSettings.create.mockResolvedValue({ id: "set-1", isActive: true });

    const settings = await PlatformSettingsService.get();
    expect(prismaMock.platformBillingSettings.create).toHaveBeenCalledWith({ data: {} });
    expect(settings.id).toBe("set-1");
  });

  it("returns the existing row without creating a duplicate", async () => {
    prismaMock.platformBillingSettings.findFirst.mockResolvedValue({ id: "set-existing", isActive: true });
    const settings = await PlatformSettingsService.get();
    expect(prismaMock.platformBillingSettings.create).not.toHaveBeenCalled();
    expect(settings.id).toBe("set-existing");
  });
});
