import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    featureFlag: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn(), createMany: vi.fn() },
    featureFlagAssignment: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() },
    gym: { findUnique: vi.fn() },
  },
}))
vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { FeatureFlagService, featureEnabled } from '../../modules/feature-flag/feature-flag.service'

beforeEach(() => vi.clearAllMocks())

describe('FeatureFlagService (Stage 10)', () => {
  it('effective flags use the per-gym override, else the default', async () => {
    prismaMock.featureFlag.findMany.mockResolvedValue([
      { key: 'ai', label: 'AI', category: 'Intelligence', defaultEnabled: true },
      { key: 'chat', label: 'Chat', category: 'Comms', defaultEnabled: true },
    ])
    prismaMock.featureFlagAssignment.findMany.mockResolvedValue([{ flagKey: 'chat', enabled: false }])

    const flags = await FeatureFlagService.effectiveForGym('g1')
    const ai = flags.find((f) => f.key === 'ai')!
    const chat = flags.find((f) => f.key === 'chat')!
    expect(ai.enabled).toBe(true)
    expect(ai.overridden).toBe(false)
    expect(chat.enabled).toBe(false) // override wins
    expect(chat.overridden).toBe(true)
  })

  it('setForGym validates the flag + gym before upserting', async () => {
    prismaMock.featureFlag.findUnique.mockResolvedValue({ key: 'ai' })
    prismaMock.gym.findUnique.mockResolvedValue({ id: 'g1' })
    prismaMock.featureFlagAssignment.upsert.mockResolvedValue({ flagKey: 'ai', gymId: 'g1', enabled: false })
    const res = await FeatureFlagService.setForGym('g1', 'ai', false)
    expect(res.enabled).toBe(false)
  })

  it('setForGym rejects an unknown flag', async () => {
    prismaMock.featureFlag.findUnique.mockResolvedValue(null)
    await expect(FeatureFlagService.setForGym('g1', 'nope', true)).rejects.toThrow()
  })
})

describe('featureEnabled helper (fail-open)', () => {
  it('returns the assignment value when present', async () => {
    prismaMock.featureFlagAssignment.findUnique.mockResolvedValue({ enabled: false })
    expect(await featureEnabled('g1', 'ai')).toBe(false)
  })
  it('falls back to the flag default when no assignment', async () => {
    prismaMock.featureFlagAssignment.findUnique.mockResolvedValue(null)
    prismaMock.featureFlag.findUnique.mockResolvedValue({ defaultEnabled: true })
    expect(await featureEnabled('g1', 'ai')).toBe(true)
  })
  it('fails OPEN for unknown flags / no gym (never breaks existing flows)', async () => {
    expect(await featureEnabled(null, 'ai')).toBe(true)
    prismaMock.featureFlagAssignment.findUnique.mockResolvedValue(null)
    prismaMock.featureFlag.findUnique.mockResolvedValue(null)
    expect(await featureEnabled('g1', 'unknown')).toBe(true)
  })
})
