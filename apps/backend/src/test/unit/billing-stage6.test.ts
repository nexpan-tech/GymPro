import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    gymSubscription: { findMany: vi.fn(), count: vi.fn() },
    saaSInvoice: { findMany: vi.fn() },
    saaSPlan: { findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { BillingAnalyticsService } from '../../modules/billing/billing.analytics.service'

beforeEach(() => vi.clearAllMocks())

describe('BillingAnalyticsService — SaaS revenue metrics', () => {
  it('MRR sums active subs (YEARLY normalised to /12)', async () => {
    prismaMock.gymSubscription.findMany.mockResolvedValue([
      { plan: { price: 1000, interval: 'MONTHLY' } },
      { plan: { price: 1200, interval: 'MONTHLY' } },
      { plan: { price: 12000, interval: 'YEARLY' } }, // → 1000/mo
    ])
    const mrr = await BillingAnalyticsService.mrr()
    expect(mrr).toBe(3200)
  })

  it('ARR = MRR × 12', async () => {
    prismaMock.gymSubscription.findMany.mockResolvedValue([{ plan: { price: 1000, interval: 'MONTHLY' } }])
    expect(await BillingAnalyticsService.arr()).toBe(12000)
  })

  it('churn rate = cancelled30 / (active + cancelled30)', async () => {
    // overview/churn call count() multiple times; return active=9 then cancelled=1
    prismaMock.gymSubscription.count
      .mockResolvedValueOnce(9) // active (in churn)
      .mockResolvedValueOnce(1) // cancelledLast30
    const churn = await BillingAnalyticsService.churn()
    expect(churn.cancelledLast30).toBe(1)
    expect(churn.churnRate).toBe(10) // 1/(9+1)=10%
  })

  it('revenueTrend buckets paid invoices by month', async () => {
    const now = new Date()
    prismaMock.saaSInvoice.findMany.mockResolvedValue([
      { totalAmount: 500, paidAt: now },
      { totalAmount: 700, paidAt: now },
    ])
    const trend = await BillingAnalyticsService.revenueTrend(6)
    expect(trend).toHaveLength(6)
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisMonth = trend.find((t) => t.month === key)
    expect(thisMonth?.revenue).toBe(1200)
  })

  it('overview returns mrr/arr/active/trial/churn', async () => {
    prismaMock.gymSubscription.findMany.mockResolvedValue([{ plan: { price: 2000, interval: 'MONTHLY' } }])
    // overview: mrr(findMany), count(active), count(trial), churn(count active, count cancelled)
    prismaMock.gymSubscription.count
      .mockResolvedValueOnce(5)  // activeGyms
      .mockResolvedValueOnce(2)  // trialGyms
      .mockResolvedValueOnce(5)  // churn active
      .mockResolvedValueOnce(0)  // churn cancelled
    const o = await BillingAnalyticsService.overview()
    expect(o.mrr).toBe(2000)
    expect(o.arr).toBe(24000)
    expect(o.activeGyms).toBe(5)
    expect(o.trialGyms).toBe(2)
    expect(o.churnRate).toBe(0)
  })
})
