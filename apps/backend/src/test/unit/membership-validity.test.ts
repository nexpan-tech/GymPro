import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => {
  // Stage 8 engagement-engine surface so the membershipRenewed points hook runs
  // silently. `$transaction` passes `tx`, so the points engine reads its ledger
  // off `tx` too — give `tx` the pointTransaction + memberXP surface.
  const engagement = {
    pointTransaction: { create: vi.fn().mockResolvedValue({}), aggregate: vi.fn().mockResolvedValue({ _sum: { points: 0 } }) },
    memberXP: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn().mockResolvedValue({ xp: 0, level: 1 }) },
    memberStreak: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ current: 1, longest: 1 }),
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    rewardRedemption: { create: vi.fn(), findMany: vi.fn() },
    referral: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn().mockResolvedValue({ id: 'n', type: 'GENERAL' }) },
  }
  const tx = {
    membership: { update: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    ...engagement,
  }
  return {
    prismaMock: {
      _tx: tx,
      member: { findFirst: vi.fn() },
      membership: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn().mockResolvedValue(0) },
      gymMembershipPlan: { findFirst: vi.fn() },
      ...engagement,
      $transaction: vi.fn(async (fn: any) => fn(tx)),
    },
  }
})

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { MembershipService } from '../../modules/membership/membership.service'

const GYM = 'gym-1'

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.membership.create.mockImplementation(async ({ data }: any) => ({ id: 'ms-1', ...data }))
  prismaMock.membership.update.mockImplementation(async ({ data }: any) => ({ id: 'ms-1', endDate: new Date(), status: 'ACTIVE', ...data }))
  prismaMock._tx.membership.create.mockImplementation(async ({ data }: any) => ({ id: 'new-1', ...data }))
  prismaMock._tx.membership.update.mockResolvedValue({})
  prismaMock._tx.membership.updateMany.mockResolvedValue({ count: 0 })
})

describe('computeStatus', () => {
  it('returns ACTIVE for a future end date', () => {
    const end = new Date(Date.now() + 5 * 86_400_000)
    expect(MembershipService.computeStatus({ status: 'ACTIVE', endDate: end })).toBe('ACTIVE')
  })
  it('returns EXPIRED for a past end date', () => {
    const end = new Date(Date.now() - 86_400_000)
    expect(MembershipService.computeStatus({ status: 'ACTIVE', endDate: end })).toBe('EXPIRED')
  })
  it('keeps FROZEN sticky regardless of dates', () => {
    const end = new Date(Date.now() - 86_400_000)
    expect(MembershipService.computeStatus({ status: 'FROZEN', endDate: end })).toBe('FROZEN')
  })
})

describe('create — end date calculation from plan', () => {
  it('derives endDate = startDate + plan.durationDays', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'member-1', gymId: GYM })
    prismaMock.gymMembershipPlan.findFirst.mockResolvedValue({ id: 'plan-1', durationDays: 30, price: 1000 })

    await MembershipService.create(GYM, {
      memberId: 'member-1', planId: 'plan-1', startDate: '2026-01-01',
    } as any)

    // create() now runs inside a $transaction (to supersede any prior active
    // membership first), so the insert goes through the tx client.
    const data = prismaMock._tx.membership.create.mock.calls[0][0].data
    expect(data.amount).toBe(1000)
    const start = new Date('2026-01-01').getTime()
    expect(new Date(data.endDate).getTime()).toBe(start + 30 * 86_400_000)
    expect(data.status).toBe('ACTIVE')
    // The member's existing open memberships are ended (one-active invariant).
    expect(prismaMock._tx.membership.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'EXPIRED' }) }),
    )
  })

  it('blocks assigning a plan from another gym', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'member-1', gymId: GYM })
    prismaMock.gymMembershipPlan.findFirst.mockResolvedValue(null)
    await expect(
      MembershipService.create(GYM, { memberId: 'member-1', planId: 'other-plan' } as any)
    ).rejects.toThrow(/plan not found in this gym/i)
  })

  it('blocks assigning to a member from another gym', async () => {
    prismaMock.member.findFirst.mockResolvedValue(null)
    await expect(
      MembershipService.create(GYM, { memberId: 'foreign', planId: 'plan-1' } as any)
    ).rejects.toThrow(/member not found in this gym/i)
  })
})

describe('extend', () => {
  it('adds days and reactivates an expired membership', async () => {
    const pastEnd = new Date(Date.now() - 10 * 86_400_000)
    prismaMock.membership.findFirst.mockResolvedValue({
      id: 'ms-1', gymId: GYM, endDate: pastEnd, extensionDays: 0, status: 'EXPIRED',
    })

    await MembershipService.extend(GYM, 'ms-1', { days: 30 })

    const data = prismaMock.membership.update.mock.calls[0][0].data
    expect(data.extensionDays).toBe(30)
    expect(new Date(data.endDate).getTime()).toBe(pastEnd.getTime() + 30 * 86_400_000)
    expect(data.status).toBe('ACTIVE') // pushed 30 days past 10-days-ago => future
  })
})

describe('freeze', () => {
  it('sets status FROZEN and pushes endDate by the freeze span', async () => {
    const end = new Date('2026-02-01')
    prismaMock.membership.findFirst.mockResolvedValue({ id: 'ms-1', gymId: GYM, endDate: end })

    await MembershipService.freeze(GYM, 'ms-1', {
      freezeStartDate: '2026-01-01', freezeEndDate: '2026-01-11',
    })

    const data = prismaMock.membership.update.mock.calls[0][0].data
    expect(data.status).toBe('FROZEN')
    expect(new Date(data.endDate).getTime()).toBe(end.getTime() + 10 * 86_400_000)
  })
})

describe('getAll currentOnly', () => {
  const future = new Date(Date.now() + 20 * 86_400_000)
  const past = new Date(Date.now() - 20 * 86_400_000)

  it('returns every row by default but one current row per member when currentOnly', async () => {
    prismaMock.membership.findMany.mockResolvedValue([
      { id: 'new', memberId: 'm1', status: 'ACTIVE', endDate: future, createdAt: new Date(Date.now()), amount: 1 },
      { id: 'old', memberId: 'm1', status: 'EXPIRED', endDate: past, createdAt: new Date(Date.now() - 1000), amount: 1 },
      { id: 'other', memberId: 'm2', status: 'ACTIVE', endDate: future, createdAt: new Date(), amount: 1 },
    ])

    const all = await MembershipService.getAll(GYM)
    expect(all).toHaveLength(3)

    const current = await MembershipService.getAll(GYM, { currentOnly: true })
    expect(current).toHaveLength(2) // one per member
    const m1 = current.find((m) => m.memberId === 'm1')
    expect(m1?.id).toBe('new') // ACTIVE preferred over EXPIRED
    expect(m1?.effectiveStatus).toBe('ACTIVE')
  })
})

describe('renew', () => {
  it('chains a new membership and marks the old one EXPIRED', async () => {
    prismaMock.membership.findFirst.mockResolvedValue({
      id: 'old-1', gymId: GYM, memberId: 'member-1', planId: 'plan-1', plan: null,
      endDate: new Date(Date.now() + 3 * 86_400_000), amount: 1000,
    })
    prismaMock.gymMembershipPlan.findFirst.mockResolvedValue({ id: 'plan-1', durationDays: 30, price: 1200 })

    await MembershipService.renew(GYM, 'old-1', {})

    // renew now ends ALL of the member's open memberships (one-active invariant)
    // via updateMany, then creates the new ACTIVE one chained from the old.
    expect(prismaMock._tx.membership.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'EXPIRED' }) })
    )
    const created = prismaMock._tx.membership.create.mock.calls[0][0].data
    expect(created.renewedFromId).toBe('old-1')
    expect(created.amount).toBe(1200)
    expect(created.status).toBe('ACTIVE')
  })
})
