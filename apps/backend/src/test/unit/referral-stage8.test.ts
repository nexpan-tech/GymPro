import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock, eventsMock } = vi.hoisted(() => ({
  prismaMock: {
    referral: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    member: { findFirst: vi.fn(), findUnique: vi.fn() },
    lead: { create: vi.fn() },
  },
  eventsMock: { referralConverted: vi.fn() },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../modules/gamification/engagement-events.service', () => ({ GamificationEvents: eventsMock }))
vi.mock('../../modules/gamification/points.service', () => ({ POINT_RULES: { REFERRAL_CONVERTED: 100 } }))

import { ReferralService, referralCodeFor } from '../../modules/referral/referral.service'

const admin = { id: 'u1', role: 'ADMIN', gymId: 'g1' }
const member = { id: 'u2', role: 'MEMBER', gymId: 'g1' }
beforeEach(() => vi.clearAllMocks())

describe('ReferralService (Stage 8)', () => {
  it('referralCodeFor is deterministic and prefixed', () => {
    const code = referralCodeFor('member-abc123')
    expect(code).toMatch(/^REF-[A-Z0-9]{6}$/)
    expect(referralCodeFor('member-abc123')).toBe(code) // stable
  })

  it('convert awards the referrer points and marks REWARDED (idempotent path guarded)', async () => {
    prismaMock.referral.findFirst.mockResolvedValue({ id: 'rf1', gymId: 'g1', referrerId: 'm1', status: 'PENDING' })
    prismaMock.referral.update.mockResolvedValue({ id: 'rf1', status: 'REWARDED' })

    await ReferralService.convert(admin, 'rf1')
    expect(eventsMock.referralConverted).toHaveBeenCalledWith(
      expect.objectContaining({ gymId: 'g1', memberId: 'm1', referralId: 'rf1', points: 100 }),
    )
    const data = prismaMock.referral.update.mock.calls[0][0].data
    expect(data.status).toBe('REWARDED')
    expect(data.rewardPoints).toBe(100)
    expect(data.convertedAt).toBeInstanceOf(Date)
  })

  it('does not re-convert an already converted referral', async () => {
    prismaMock.referral.findFirst.mockResolvedValue({ id: 'rf1', gymId: 'g1', referrerId: 'm1', status: 'REWARDED' })
    await expect(ReferralService.convert(admin, 'rf1')).rejects.toThrow()
    expect(eventsMock.referralConverted).not.toHaveBeenCalled()
  })

  it('TENANT ISOLATION: cannot convert a referral from another gym', async () => {
    prismaMock.referral.findFirst.mockResolvedValue(null)
    await expect(ReferralService.convert(admin, 'rfX')).rejects.toThrow()
  })

  it('createInvite records a referral and a REFERRAL lead when contactable', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm2', gymId: 'g1' })
    prismaMock.member.findUnique.mockResolvedValue({ id: 'm2', user: { name: 'Referrer' } })
    prismaMock.lead.create.mockResolvedValue({ id: 'lead1' })
    prismaMock.referral.create.mockResolvedValue({ id: 'rf2', status: 'PENDING' })

    await ReferralService.createInvite(member, { inviteeName: 'Friend', inviteePhone: '9990001111' })
    expect(prismaMock.lead.create.mock.calls[0][0].data.source).toBe('REFERRAL')
    expect(prismaMock.referral.create.mock.calls[0][0].data).toMatchObject({ gymId: 'g1', referrerId: 'm2', referredLeadId: 'lead1' })
  })
})
