import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { member: { findFirst: vi.fn() } },
}))
vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { RecommendationEngine, type Recommendation } from '../../modules/ai/recommendation.engine'

function memberWith(overrides: Record<string, unknown> = {}) {
  const future = new Date(Date.now() + 30 * 864e5)
  return {
    id: 'm1', gymId: 'g1', userId: 'u1',
    attendances: [], workoutCompletions: [], dietCompletions: [], bodyMeasurements: [],
    memberships: [{ endDate: future }], streaks: [], challengeParticipants: [], dietPlan: null,
    ...overrides,
  }
}

beforeEach(() => vi.clearAllMocks())

describe('RecommendationEngine (Stage 10, rule-based)', () => {
  it('returns recommendations in the {title,description,confidence,category} shape', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberWith())
    const recs = await RecommendationEngine.forMember('g1', 'm1')
    expect(recs.length).toBeGreaterThan(0)
    for (const r of recs as Recommendation[]) {
      expect(typeof r.title).toBe('string')
      expect(typeof r.description).toBe('string')
      expect(r.confidence).toBeGreaterThan(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
      expect(['WORKOUT', 'DIET', 'ENGAGEMENT', 'RENEWAL', 'CHALLENGE']).toContain(r.category)
    }
  })

  it('a brand-new member gets workout + diet + challenge nudges', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberWith())
    const cats = (await RecommendationEngine.forMember('g1', 'm1')).map((r) => r.category)
    expect(cats).toContain('WORKOUT')
    expect(cats).toContain('DIET')
    expect(cats).toContain('CHALLENGE')
  })

  it('flags renewal when the membership expires within a week', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberWith({ memberships: [{ endDate: new Date(Date.now() + 2 * 864e5) }] }))
    const cats = (await RecommendationEngine.forMember('g1', 'm1')).map((r) => r.category)
    expect(cats).toContain('RENEWAL')
  })

  it('celebrates being close to a streak record (positive framing)', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberWith({
      attendances: [{ date: new Date() }],
      streaks: [{ type: 'ATTENDANCE', current: 9, longest: 10 }],
    }))
    const recs = await RecommendationEngine.forMember('g1', 'm1')
    const streakRec = recs.find((r) => r.title.toLowerCase().includes('streak record'))
    expect(streakRec).toBeTruthy()
    expect(streakRec?.category).toBe('ENGAGEMENT')
  })

  it('throws for an unknown member', async () => {
    prismaMock.member.findFirst.mockResolvedValue(null)
    await expect(RecommendationEngine.forMember('g1', 'x')).rejects.toThrow()
  })
})
