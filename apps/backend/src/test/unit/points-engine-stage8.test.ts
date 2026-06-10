import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => {
  const pointTransaction = { create: vi.fn(), aggregate: vi.fn(), findMany: vi.fn() }
  const memberXP = { findUnique: vi.fn(), upsert: vi.fn() }
  const mock: Record<string, unknown> = {
    pointTransaction,
    memberXP,
    $transaction: vi.fn().mockImplementation(async (fn: (db: unknown) => unknown) => fn(mock)),
  }
  return { prismaMock: mock }
})

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { PointsService, levelForXp, POINT_RULES } from '../../modules/gamification/points.service'

beforeEach(() => vi.clearAllMocks())

describe('PointsService — points/XP engine (Stage 8)', () => {
  it('awards rule-based points and bumps lifetime XP + level', async () => {
    ;(prismaMock.pointTransaction as any).create.mockResolvedValue({ id: 'pt1' })
    ;(prismaMock.memberXP as any).findUnique.mockResolvedValue(null)
    ;(prismaMock.memberXP as any).upsert.mockResolvedValue({ xp: 10, level: 1 })
    ;(prismaMock.pointTransaction as any).aggregate.mockResolvedValue({ _sum: { points: 10 } })

    const res = await PointsService.award({ gymId: 'g1', memberId: 'm1', event: 'ATTENDANCE_CHECKIN', refId: 'a1' })
    expect(res.awarded).toBe(true)
    expect(res.points).toBe(POINT_RULES.ATTENDANCE_CHECKIN)
    expect(res.lifetimePoints).toBe(10)
    expect(res.balance).toBe(10)
  })

  it('IDEMPOTENT: a duplicate event (unique eventKey) grants no extra points', async () => {
    ;(prismaMock.pointTransaction as any).create.mockRejectedValue({ code: 'P2002' })
    ;(prismaMock.memberXP as any).findUnique.mockResolvedValue({ xp: 10, level: 1 })
    ;(prismaMock.pointTransaction as any).aggregate.mockResolvedValue({ _sum: { points: 10 } })

    const res = await PointsService.award({ gymId: 'g1', memberId: 'm1', event: 'ATTENDANCE_CHECKIN', refId: 'a1' })
    expect(res.awarded).toBe(false)
    expect(res.points).toBe(0)
    expect(res.balance).toBe(10) // unchanged
    expect((prismaMock.memberXP as any).upsert).not.toHaveBeenCalled()
  })

  it('spend() rejects when balance is insufficient', async () => {
    ;(prismaMock.pointTransaction as any).aggregate.mockResolvedValue({ _sum: { points: 30 } })
    await expect(
      PointsService.spend({ gymId: 'g1', memberId: 'm1', points: 50, eventKey: 'REWARD_REDEEMED:r1' }),
    ).rejects.toThrow()
    expect((prismaMock.pointTransaction as any).create).not.toHaveBeenCalled()
  })

  it('spend() writes a negative ledger entry when affordable', async () => {
    ;(prismaMock.pointTransaction as any).aggregate.mockResolvedValue({ _sum: { points: 100 } })
    ;(prismaMock.pointTransaction as any).create.mockResolvedValue({ id: 'pt2' })
    const res = await PointsService.spend({ gymId: 'g1', memberId: 'm1', points: 40, eventKey: 'REWARD_REDEEMED:r1' })
    expect(res.spent).toBe(40)
    expect(res.balance).toBe(60)
    const data = (prismaMock.pointTransaction as any).create.mock.calls[0][0].data
    expect(data.points).toBe(-40)
    expect(data.event).toBe('REWARD_REDEEMED')
  })

  it('levelForXp: 100 XP per level', () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(99)).toBe(1)
    expect(levelForXp(100)).toBe(2)
    expect(levelForXp(350)).toBe(4)
  })
})
