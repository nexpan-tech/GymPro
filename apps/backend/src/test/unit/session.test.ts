import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
    session: { create: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../utils/password', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}))

import { AuthService } from '../../modules/auth/auth.service'

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.session.updateMany.mockResolvedValue({ count: 1 })
})

describe('Session management', () => {
  it('logout revokes only the matching active session', async () => {
    await AuthService.logout('refresh-token-value')

    expect(prismaMock.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      })
    )
    // the lookup is by hashed token, never the raw value
    const call = prismaMock.session.updateMany.mock.calls[0][0]
    expect(call.where.refreshTokenHash).toBeTypeOf('string')
    expect(call.where.refreshTokenHash).not.toBe('refresh-token-value')
  })

  it('logoutAll revokes every active session for the user', async () => {
    await AuthService.logoutAll('user-1')

    expect(prismaMock.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', revokedAt: null },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      })
    )
  })

  it('refresh only matches non-revoked, unexpired sessions', async () => {
    prismaMock.session.findFirst.mockResolvedValue(null)
    await expect(AuthService.refresh('x')).rejects.toThrow()

    const where = prismaMock.session.findFirst.mock.calls[0][0].where
    expect(where.revokedAt).toBeNull()
    expect(where.expiresAt).toHaveProperty('gt')
  })
})
