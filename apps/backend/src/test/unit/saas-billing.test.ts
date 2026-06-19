import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, sendEmailMock } = vi.hoisted(() => {
  const prismaMock: any = {
    member: { groupBy: vi.fn(), count: vi.fn() },
    gym: { findMany: vi.fn() },
    platformBillingSettings: { findFirst: vi.fn(), create: vi.fn() },
    saaSInvoice: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  const sendEmailMock = vi.fn();
  return { prismaMock, sendEmailMock };
});

vi.mock("../../config/db", () => ({ prisma: prismaMock }));
// Keep email + logger + PDF + audit side-effect-free in tests.
vi.mock("../../modules/email/email.service", () => ({ sendEmail: sendEmailMock }));
vi.mock("../../config/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("../../modules/reports/pdf.service", () => ({ generateSaaSInvoicePdf: vi.fn().mockResolvedValue(Buffer.from("PDF")) }));
vi.mock("../../utils/audit", () => ({ createAuditLog: vi.fn() }));

import { SaaSBillingService, computeBill } from "../../modules/super-admin/saas-billing.service";

beforeEach(() => {
  vi.clearAllMocks();
  sendEmailMock.mockResolvedValue({ skipped: true });
  prismaMock.platformBillingSettings.findFirst.mockResolvedValue({
    id: "set-1", companyName: "Nexpan Tech", invoicePrefix: "SAAS", dueDays: 15, defaultGstPercent: 18, isActive: true,
  });
});

describe("computeBill — per-active-member + GST", () => {
  it("computes 20 members × ₹20 = ₹400 subtotal, +18% GST = ₹472 total", () => {
    const { subtotal, gstAmount, total } = computeBill(20, 20, 18);
    expect(subtotal).toBe(400);
    expect(gstAmount).toBe(72);
    expect(total).toBe(472);
  });
  it("handles zero price / zero members as zero", () => {
    expect(computeBill(0, 20, 18)).toEqual({ subtotal: 0, gstAmount: 0, total: 0 });
    expect(computeBill(15, 0, 18)).toEqual({ subtotal: 0, gstAmount: 0, total: 0 });
  });
});

describe("SaaSBillingService.generateInvoices", () => {
  it("creates one GST invoice per eligible gym and skips 0-member / 0-price gyms", async () => {
    prismaMock.member.groupBy.mockResolvedValue([
      { gymId: "g1", _count: { _all: 20 } },
      { gymId: "g2", _count: { _all: 0 } },
    ]);
    prismaMock.gym.findMany.mockResolvedValue([
      { id: "g1", name: "Gym One", gstPercent: 18, pricePerActiveMember: 20, gstNumber: null, users: [{ email: "a@g1.com" }] },
      { id: "g2", name: "Gym Two", gstPercent: 18, pricePerActiveMember: 20, gstNumber: null, users: [] }, // 0 members → skip
      { id: "g3", name: "Gym Three", gstPercent: 18, pricePerActiveMember: 0, gstNumber: null, users: [] }, // 0 price → skip
    ]);
    prismaMock.saaSInvoice.findFirst.mockResolvedValue(null); // none exist yet
    prismaMock.saaSInvoice.create.mockImplementation(({ data }: any) => Promise.resolve({ id: "inv-g1", ...data }));
    prismaMock.saaSInvoice.update.mockImplementation(({ data }: any) => Promise.resolve({ id: "inv-g1", ...data }));

    const res = await SaaSBillingService.generateInvoices("2026-06");

    expect(res.billingMonth).toBe("2026-06");
    expect(res.created).toBe(1);
    expect(res.skipped).toBe(2);
    expect(res.totalBilled).toBe(472);
    const createArg = prismaMock.saaSInvoice.create.mock.calls[0][0].data;
    expect(createArg.gymId).toBe("g1");
    expect(createArg.amount).toBe(400);
    expect(createArg.gstAmount).toBe(72);
    expect(createArg.totalAmount).toBe(472);
    expect(createArg.activeMemberCount).toBe(20);
    expect(createArg.status).toBe("PENDING");
    // Email skipped (no SMTP) → invoice stays PENDING with SKIPPED email status.
    expect(prismaMock.saaSInvoice.update.mock.calls[0][0].data.emailStatus).toBe("SKIPPED");
  });

  it("is idempotent — skips a gym already invoiced for the month", async () => {
    prismaMock.member.groupBy.mockResolvedValue([{ gymId: "g1", _count: { _all: 10 } }]);
    prismaMock.gym.findMany.mockResolvedValue([
      { id: "g1", name: "Gym One", gstPercent: 18, pricePerActiveMember: 20, gstNumber: null, users: [] },
    ]);
    prismaMock.saaSInvoice.findFirst.mockResolvedValue({ id: "existing" }); // already billed
    const res = await SaaSBillingService.generateInvoices("2026-06");
    expect(res.created).toBe(0);
    expect(res.skipped).toBe(1);
    expect(prismaMock.saaSInvoice.create).not.toHaveBeenCalled();
  });
});

describe("SaaSBillingService.recordPayment", () => {
  it("marks an invoice PAID with paidAt", async () => {
    prismaMock.saaSInvoice.findUnique.mockResolvedValue({ id: "inv-1", status: "PENDING" });
    prismaMock.saaSInvoice.update.mockResolvedValue({ id: "inv-1", status: "PAID" });
    const out = await SaaSBillingService.recordPayment("inv-1");
    expect(prismaMock.saaSInvoice.update.mock.calls[0][0].data.status).toBe("PAID");
    expect(prismaMock.saaSInvoice.update.mock.calls[0][0].data.paidAt).toBeInstanceOf(Date);
    expect(out.status).toBe("PAID");
  });
  it("is idempotent for an already-paid invoice", async () => {
    prismaMock.saaSInvoice.findUnique.mockResolvedValue({ id: "inv-1", status: "PAID" });
    await SaaSBillingService.recordPayment("inv-1");
    expect(prismaMock.saaSInvoice.update).not.toHaveBeenCalled();
  });
  it("refuses to pay a cancelled invoice", async () => {
    prismaMock.saaSInvoice.findUnique.mockResolvedValue({ id: "inv-1", status: "CANCELLED" });
    await expect(SaaSBillingService.recordPayment("inv-1")).rejects.toThrow(/cancelled/i);
  });
  it("404s for a missing invoice", async () => {
    prismaMock.saaSInvoice.findUnique.mockResolvedValue(null);
    await expect(SaaSBillingService.recordPayment("ghost")).rejects.toThrow(/not found/i);
  });
});

describe("SaaSBillingService.revenueSummary", () => {
  it("computes per-member MRR from active members × price (no plan tiers)", async () => {
    prismaMock.member.groupBy.mockResolvedValue([
      { gymId: "g1", _count: { _all: 20 } },
      { gymId: "g2", _count: { _all: 5 } },
    ]);
    prismaMock.gym.findMany.mockResolvedValue([
      { id: "g1", pricePerActiveMember: 20, gstPercent: 18 },
      { id: "g2", pricePerActiveMember: 50, gstPercent: 18 },
    ]);
    prismaMock.saaSInvoice.findMany.mockResolvedValue([
      { status: "PAID", totalAmount: 472, dueDate: new Date(), paidAt: new Date() },
      { status: "PENDING", totalAmount: 200, dueDate: new Date(Date.now() + 86400000), paidAt: null },
    ]);
    const s = await SaaSBillingService.revenueSummary();
    expect(s.mrr).toBe(20 * 20 + 5 * 50); // 650
    expect(s.arr).toBe(650 * 12);
    expect(s.paid).toBe(472);
    expect(s.pending).toBe(200);
  });
});
