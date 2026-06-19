import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    member: { findMany: vi.fn() },
    memberXP: { findMany: vi.fn() },
    challenge: { findFirst: vi.fn() },
    challengeParticipant: { findMany: vi.fn() },
    pointTransaction: { groupBy: vi.fn() },
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../modules/notification/notification.service', () => ({ NotificationService: { create: vi.fn() } }))

import { GamificationService } from '../../modules/gamification/gamification.service'

const user = { id: 'u1', role: 'ADMIN', gymId: 'g1' }
beforeEach(() => vi.clearAllMocks())

describe('GamificationService.leaderboard (Stage 8)', () => {
  it('GYM scope ranks members by points, gym-scoped', async () => {
    prismaMock.member.findMany.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }])
    prismaMock.memberXP.findMany.mockResolvedValue([
      { memberId: 'm1', xp: 200, level: 3, streak: 5, member: { user: { name: 'Asha' } } },
      { memberId: 'm2', xp: 100, level: 2, streak: 2, member: { user: { name: 'Ben' } } },
    ])
    const rows = await GamificationService.leaderboard(user, 'GYM')
    expect(rows[0]).toMatchObject({ rank: 1, name: 'Asha', xp: 200 })
    expect(rows[1].rank).toBe(2)
    // Tenant scoping: member query filtered by gymId.
    expect(prismaMock.member.findMany.mock.calls[0][0].where.gymId).toBe('g1')
  })

  it('BRANCH scope filters members by branchId', async () => {
    prismaMock.member.findMany.mockResolvedValue([{ id: 'm1' }])
    prismaMock.memberXP.findMany.mockResolvedValue([{ memberId: 'm1', xp: 50, level: 1, streak: 0, member: { user: { name: 'A' } } }])
    await GamificationService.leaderboard(user, 'BRANCH', 'branch-1')
    expect(prismaMock.member.findMany.mock.calls[0][0].where).toMatchObject({ gymId: 'g1', branchId: 'branch-1' })
  })

  it('CHALLENGE scope ranks participants by progress', async () => {
    prismaMock.challenge.findFirst.mockResolvedValue({ id: 'c1', gymId: 'g1' })
    prismaMock.challengeParticipant.findMany.mockResolvedValue([
      { memberId: 'm1', progress: 80, isCompleted: true, member: { user: { name: 'Asha' } } },
      { memberId: 'm2', progress: 40, isCompleted: false, member: { user: { name: 'Ben' } } },
    ])
    const rows = await GamificationService.leaderboard(user, 'CHALLENGE', 'c1')
    expect(rows[0]).toMatchObject({ rank: 1, name: 'Asha', progress: 80, isCompleted: true })
  })

  it('CHALLENGE scope requires a challengeId', async () => {
    await expect(GamificationService.leaderboard(user, 'CHALLENGE')).rejects.toThrow()
  })

  it('MONTH period ranks by points earned this month (PointTransaction ledger)', async () => {
    // First member.findMany → scope members; second → name/level/streak lookup.
    prismaMock.member.findMany
      .mockResolvedValueOnce([{ id: 'm1' }, { id: 'm2' }])
      .mockResolvedValueOnce([
        { id: 'm1', user: { name: 'Asha' }, memberXp: { level: 3, streak: 5 } },
        { id: 'm2', user: { name: 'Ben' }, memberXp: { level: 2, streak: 1 } },
      ])
    prismaMock.pointTransaction.groupBy.mockResolvedValue([
      { memberId: 'm1', _sum: { points: 120 } },
      { memberId: 'm2', _sum: { points: 60 } },
    ])
    const rows = await GamificationService.leaderboard(user, 'GYM', undefined, 20, 'MONTH')
    expect(rows[0]).toMatchObject({ rank: 1, name: 'Asha', xp: 120, level: 3, streak: 5 })
    expect(rows[1]).toMatchObject({ rank: 2, name: 'Ben', xp: 60 })
    // It queried the ledger windowed to the current month.
    const where = prismaMock.pointTransaction.groupBy.mock.calls[0][0].where
    expect(where.gymId).toBe('g1')
    expect(where.createdAt.gte).toBeInstanceOf(Date)
  })
})
