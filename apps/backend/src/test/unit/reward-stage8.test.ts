import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock, pointsMock } = vi.hoisted(() => ({
  prismaMock: {
    member: { findFirst: vi.fn() },
    reward: { findFirst: vi.fn(), update: vi.fn() },
    rewardRedemption: { create: vi.fn() },
  },
  pointsMock: { balance: vi.fn(), spend: vi.fn() },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../modules/gamification/points.service', () => ({
  PointsService: pointsMock,
  POINT_RULES: {},
  levelForXp: (xp: number) => Math.floor(xp / 100) + 1,
}))
vi.mock('../../modules/gamification/streak.service', () => ({ StreakService: { getMemberStreaks: vi.fn() } }))
vi.mock('../../modules/notification/notification.service', () => ({ NotificationService: { create: vi.fn().mockResolvedValue({}) } }))

import { GamificationService } from '../../modules/gamification/gamification.service'

const member = { id: 'u1', role: 'MEMBER', gymId: 'g1' }
beforeEach(() => vi.clearAllMocks())

describe('GamificationService.redeemReward (Stage 8)', () => {
  it('redeems when the member can afford it, spending points', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: 'g1' })
    prismaMock.reward.findFirst.mockResolvedValue({ id: 'r1', isActive: true, stock: null, pointsCost: 50, title: 'Free shake' })
    pointsMock.balance.mockResolvedValueOnce(120).mockResolvedValueOnce(70)
    prismaMock.rewardRedemption.create.mockResolvedValue({ id: 'rr1' })
    pointsMock.spend.mockResolvedValue({ spent: 50, balance: 70 })

    const res = await GamificationService.redeemReward(member, 'r1')
    expect(prismaMock.rewardRedemption.create).toHaveBeenCalled()
    expect(pointsMock.spend).toHaveBeenCalledWith(expect.objectContaining({ memberId: 'm1', points: 50, eventKey: 'REWARD_REDEEMED:rr1' }))
    expect((res as { balance: number }).balance).toBe(70)
  })

  it('rejects redemption when balance is insufficient (no redemption row)', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: 'g1' })
    prismaMock.reward.findFirst.mockResolvedValue({ id: 'r1', isActive: true, stock: null, pointsCost: 200, title: 'Big prize' })
    pointsMock.balance.mockResolvedValue(50)

    await expect(GamificationService.redeemReward(member, 'r1')).rejects.toThrow()
    expect(prismaMock.rewardRedemption.create).not.toHaveBeenCalled()
    expect(pointsMock.spend).not.toHaveBeenCalled()
  })

  it('rejects an inactive reward', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: 'g1' })
    prismaMock.reward.findFirst.mockResolvedValue({ id: 'r1', isActive: false, pointsCost: 10 })
    await expect(GamificationService.redeemReward(member, 'r1')).rejects.toThrow()
  })

  it('rejects an out-of-stock reward', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: 'g1' })
    prismaMock.reward.findFirst.mockResolvedValue({ id: 'r1', isActive: true, stock: 0, pointsCost: 10 })
    await expect(GamificationService.redeemReward(member, 'r1')).rejects.toThrow()
  })
})
