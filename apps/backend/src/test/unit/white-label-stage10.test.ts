import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { whiteLabelSetting: { upsert: vi.fn(), findUnique: vi.fn() } },
}))
vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { WhiteLabelService } from '../../modules/white-label/white-label.service'

const admin = { id: 'a', role: 'ADMIN', gymId: 'g1' }
beforeEach(() => vi.clearAllMocks())

describe('WhiteLabelService (Stage 10 — email branding)', () => {
  it('upsert persists app + color + email branding fields', async () => {
    prismaMock.whiteLabelSetting.upsert.mockResolvedValue({ id: 'wl1' })
    await WhiteLabelService.upsertSettings(admin, {
      appName: 'FitZone',
      primaryColor: '#ff0000',
      emailFromName: 'FitZone Gym',
      emailLogoUrl: 'https://x/logo.png',
      emailFooterText: 'See you at the gym',
      supportEmail: 'help@fitzone.com',
    })
    const arg = prismaMock.whiteLabelSetting.upsert.mock.calls[0][0]
    expect(arg.where).toEqual({ gymId: 'g1' })
    expect(arg.create).toMatchObject({
      gymId: 'g1', appName: 'FitZone', primaryColor: '#ff0000',
      emailFromName: 'FitZone Gym', emailLogoUrl: 'https://x/logo.png',
      emailFooterText: 'See you at the gym', supportEmail: 'help@fitzone.com',
    })
    expect(arg.update).toMatchObject({ emailFromName: 'FitZone Gym', supportEmail: 'help@fitzone.com' })
  })

  it('requires gym context', async () => {
    await expect(WhiteLabelService.upsertSettings({ id: 'x', role: 'ADMIN', gymId: null }, {})).rejects.toThrow()
  })
})
