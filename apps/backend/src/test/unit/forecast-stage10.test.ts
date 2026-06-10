import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    member: { findMany: vi.fn().mockResolvedValue([]) },
    payment: { findMany: vi.fn().mockResolvedValue([]) },
    attendance: { findMany: vi.fn().mockResolvedValue([]) },
    lead: { findMany: vi.fn().mockResolvedValue([]) },
    membership: { findMany: vi.fn().mockResolvedValue([]) },
  },
}))
vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { projectNext, monthlySeries } from '../../modules/ai/trend'
import { ForecastEngine } from '../../modules/ai/forecast.engine'

const admin = { id: 'a', role: 'ADMIN', gymId: 'g1' }
beforeEach(() => vi.clearAllMocks())

describe('Trend math (Stage 10)', () => {
  it('projects an upward trend forward', () => {
    const t = projectNext([10, 20, 30, 40])
    expect(t.direction).toBe('up')
    expect(t.projected).toBeGreaterThan(40)
    expect(t.confidence).toBeGreaterThan(0)
  })
  it('detects a downward trend', () => {
    expect(projectNext([40, 30, 20]).direction).toBe('down')
  })
  it('flat series → flat', () => {
    expect(projectNext([10, 10, 10]).direction).toBe('flat')
  })
  it('handles empty / single-point series safely', () => {
    expect(projectNext([]).projected).toBe(0)
    expect(projectNext([7]).projected).toBe(7)
  })
  it('monthlySeries buckets dated rows into N months', () => {
    const now = new Date('2026-06-15')
    const series = monthlySeries([{ date: '2026-06-01', value: 2 }, { date: '2026-06-20' }, { date: '2026-05-01', value: 5 }], 6, now)
    expect(series).toHaveLength(6)
    expect(series[5]).toBe(3) // June: 2 + 1
    expect(series[4]).toBe(5) // May
  })
})

describe('ForecastEngine (Stage 10)', () => {
  it('returns the five required forecasts with metric + direction', async () => {
    const forecasts = await ForecastEngine.forGym(admin)
    const metrics = forecasts.map((f) => f.metric)
    expect(metrics).toEqual(expect.arrayContaining([
      'membershipGrowth', 'revenueGrowth', 'attendanceForecast', 'leadConversionForecast', 'churnForecast',
    ]))
    for (const f of forecasts) {
      expect(['up', 'down', 'flat']).toContain(f.direction)
      expect(typeof f.confidence).toBe('number')
    }
  })

  it('requires gym context', async () => {
    await expect(ForecastEngine.forGym({ id: 'x', role: 'ADMIN', gymId: null })).rejects.toThrow()
  })
})
