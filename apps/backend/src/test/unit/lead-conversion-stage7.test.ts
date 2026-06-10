import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    trialMembership: { findFirst: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    lead: { findFirst: vi.fn(), update: vi.fn() },
    member: { findFirst: vi.fn() },
    leadActivity: { create: vi.fn() },
  },
}))
const { membershipCreate } = vi.hoisted(() => ({ membershipCreate: vi.fn() }))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../modules/membership/membership.service', () => ({
  MembershipService: { create: membershipCreate },
}))

import { TrialService } from '../../modules/trial/trial.service'

const admin = { id: 'u1', role: 'ADMIN', gymId: 'gym1' }

beforeEach(() => vi.clearAllMocks())

describe('TrialService.convert — trial → paid membership (Stage 7)', () => {
  it('creates a real membership and marks trial + lead CONVERTED', async () => {
    prismaMock.trialMembership.findFirst.mockResolvedValue({
      id: 't1', gymId: 'gym1', status: 'ACTIVE', memberId: 'm1', planId: 'p1', leadId: 'l1',
    })
    membershipCreate.mockResolvedValue({ id: 'mem1' })
    prismaMock.trialMembership.update.mockResolvedValue({ id: 't1', status: 'CONVERTED' })
    prismaMock.lead.update.mockResolvedValue({ id: 'l1' })

    const res = await TrialService.convert(admin, 't1', {})

    // Reuses MembershipService — no duplicate membership logic.
    expect(membershipCreate).toHaveBeenCalledWith('gym1', expect.objectContaining({ memberId: 'm1', planId: 'p1' }))
    const trialUpdate = prismaMock.trialMembership.update.mock.calls[0][0].data
    expect(trialUpdate.status).toBe('CONVERTED')
    expect(trialUpdate.convertedAt).toBeInstanceOf(Date)
    expect(trialUpdate.convertedMembershipId).toBe('mem1')

    // Lead pipeline updated + conversion logged.
    expect(prismaMock.lead.update.mock.calls[0][0].data.status).toBe('CONVERTED')
    expect(prismaMock.leadActivity.create.mock.calls[0][0].data.type).toBe('CONVERSION')
    expect((res.membership as { id: string }).id).toBe('mem1')
  })

  it('does not double-convert an already-converted trial', async () => {
    prismaMock.trialMembership.findFirst.mockResolvedValue({ id: 't1', gymId: 'gym1', status: 'CONVERTED' })
    await expect(TrialService.convert(admin, 't1', {})).rejects.toThrow()
    expect(membershipCreate).not.toHaveBeenCalled()
  })

  it('converts a lead-only trial without a membership when no member/plan', async () => {
    prismaMock.trialMembership.findFirst.mockResolvedValue({
      id: 't2', gymId: 'gym1', status: 'ACTIVE', memberId: null, planId: null, leadId: 'l2',
    })
    prismaMock.trialMembership.update.mockResolvedValue({ id: 't2', status: 'CONVERTED' })
    prismaMock.lead.update.mockResolvedValue({ id: 'l2' })

    const res = await TrialService.convert(admin, 't2', {})
    expect(membershipCreate).not.toHaveBeenCalled()
    expect(res.membership).toBeNull()
    expect(prismaMock.trialMembership.update.mock.calls[0][0].data.convertedMembershipId).toBeNull()
  })
})

describe('TrialService.stats — conversion rate (Stage 7)', () => {
  it('computes conversionRate from trial statuses', async () => {
    prismaMock.trialMembership.findMany.mockResolvedValue([
      { status: 'CONVERTED' }, { status: 'CONVERTED' }, { status: 'ACTIVE' }, { status: 'EXPIRED' },
    ])
    const s = await TrialService.stats(admin)
    expect(s.total).toBe(4)
    expect(s.converted).toBe(2)
    expect(s.conversionRate).toBe(50)
  })
})
