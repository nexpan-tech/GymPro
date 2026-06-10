import { describe, it, expect, vi } from 'vitest'

// Pure scoring — no DB needed, but the module imports config/db on load.
vi.mock('../../config/db', () => ({ prisma: {} }))

import {
  computeMemberScores,
  riskLevelFromScore,
  type MemberScoreInput,
} from '../../modules/retention/retention.service'

const base: MemberScoreInput = {
  daysSinceLastAttendance: 1,
  attendanceLast30: 12,
  workoutCompletions: 6,
  dietCompletions: 4,
  progressUpdatesLast90: 2,
  membershipExpired: false,
  pendingDue: 0,
  renewalCount: 1,
}

describe('risk scoring — deterministic (Stage 7)', () => {
  it('engaged member → low risk, high retention', () => {
    const s = computeMemberScores(base)
    expect(s.riskLevel).toBe('LOW')
    expect(s.riskScore).toBeLessThan(25)
    expect(s.retentionScore).toBeGreaterThan(60)
  })

  it('inactive + expired + dues + no workouts → CRITICAL', () => {
    const s = computeMemberScores({
      daysSinceLastAttendance: 45,
      attendanceLast30: 0,
      workoutCompletions: 0,
      dietCompletions: 0,
      progressUpdatesLast90: 0,
      membershipExpired: true,
      pendingDue: 500,
      renewalCount: 0,
    })
    // 40 (inactive) + 25 (expired) + 20 (dues) + 10 (no workouts) + 5 (no progress) = 100
    expect(s.riskScore).toBe(100)
    expect(s.riskLevel).toBe('CRITICAL')
    expect(s.retentionScore).toBe(0)
  })

  it('never-attended member is treated as 30+ days inactive', () => {
    const s = computeMemberScores({ ...base, daysSinceLastAttendance: null, attendanceLast30: 0, workoutCompletions: 0, progressUpdatesLast90: 0 })
    expect(s.riskScore).toBeGreaterThanOrEqual(40)
  })

  it('riskLevelFromScore respects all four bands', () => {
    expect(riskLevelFromScore(0)).toBe('LOW')
    expect(riskLevelFromScore(24)).toBe('LOW')
    expect(riskLevelFromScore(25)).toBe('MEDIUM')
    expect(riskLevelFromScore(49)).toBe('MEDIUM')
    expect(riskLevelFromScore(50)).toBe('HIGH')
    expect(riskLevelFromScore(74)).toBe('HIGH')
    expect(riskLevelFromScore(75)).toBe('CRITICAL')
    expect(riskLevelFromScore(100)).toBe('CRITICAL')
  })

  it('scores are clamped to 0–100', () => {
    const s = computeMemberScores({ ...base, attendanceLast30: 999, workoutCompletions: 999, renewalCount: 99 })
    expect(s.retentionScore).toBeLessThanOrEqual(100)
    expect(s.riskScore).toBeGreaterThanOrEqual(0)
  })
})
