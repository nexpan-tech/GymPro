import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    memberStreak: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { StreakService } from '../../modules/gamification/streak.service'

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

beforeEach(() => vi.clearAllMocks())

describe('StreakService — date-aware streaks (Stage 8)', () => {
  it('creates a streak of 1 on first activity', async () => {
    prismaMock.memberStreak.findUnique.mockResolvedValue(null)
    prismaMock.memberStreak.create.mockResolvedValue({ current: 1, longest: 1 })
    const res = await StreakService.record({ gymId: 'g1', memberId: 'm1', type: 'ATTENDANCE' })
    expect(res.current).toBe(1)
    expect(res.changed).toBe(true)
  })

  it('increments on a consecutive day', async () => {
    prismaMock.memberStreak.findUnique.mockResolvedValue({ id: 's1', current: 3, longest: 5, lastActivityDate: daysAgo(1) })
    prismaMock.memberStreak.update.mockResolvedValue({})
    const res = await StreakService.record({ gymId: 'g1', memberId: 'm1', type: 'ATTENDANCE' })
    expect(res.current).toBe(4)
    expect(res.longest).toBe(5) // unchanged (4 < 5)
  })

  it('is idempotent on the same day', async () => {
    prismaMock.memberStreak.findUnique.mockResolvedValue({ id: 's1', current: 3, longest: 5, lastActivityDate: new Date() })
    const res = await StreakService.record({ gymId: 'g1', memberId: 'm1', type: 'ATTENDANCE' })
    expect(res.current).toBe(3)
    expect(res.changed).toBe(false)
    expect(prismaMock.memberStreak.update).not.toHaveBeenCalled()
  })

  it('resets to 1 after a missed day (gap > 1)', async () => {
    prismaMock.memberStreak.findUnique.mockResolvedValue({ id: 's1', current: 9, longest: 9, lastActivityDate: daysAgo(3) })
    prismaMock.memberStreak.update.mockResolvedValue({})
    const res = await StreakService.record({ gymId: 'g1', memberId: 'm1', type: 'ATTENDANCE' })
    expect(res.current).toBe(1)
    expect(res.longest).toBe(9) // longest preserved
  })

  it('flags a milestone every 7 days and grows longest', async () => {
    prismaMock.memberStreak.findUnique.mockResolvedValue({ id: 's1', current: 6, longest: 6, lastActivityDate: daysAgo(1) })
    prismaMock.memberStreak.update.mockResolvedValue({})
    const res = await StreakService.record({ gymId: 'g1', memberId: 'm1', type: 'WORKOUT' })
    expect(res.current).toBe(7)
    expect(res.longest).toBe(7)
    expect(res.milestone).toBe(true)
  })

  it('getMemberStreaks marks a stale streak (lastActivity > 1 day ago) as 0 current', async () => {
    prismaMock.memberStreak.findMany.mockResolvedValue([
      { type: 'ATTENDANCE', current: 9, longest: 9, lastActivityDate: daysAgo(5) },
    ])
    const rows = await StreakService.getMemberStreaks('g1', 'm1')
    const att = rows.find((r) => r.type === 'ATTENDANCE')!
    expect(att.current).toBe(0) // stale
    expect(att.longest).toBe(9)
  })
})
