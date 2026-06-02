import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuditAction } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    auditLog: { create: vi.fn() },
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../config/logger', () => ({ logger: { error: vi.fn() } }))

import { createAuditLog } from '../../utils/audit'

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.auditLog.create.mockResolvedValue({})
})

describe('createAuditLog', () => {
  it('writes to the real schema columns (entityType, not entity)', async () => {
    await createAuditLog({
      gymId: 'gym-1',
      userId: 'user-1',
      action: AuditAction.LOGIN,
      entity: 'AuthLogin',
      entityId: 'user-1',
      newData: { email: 'a@b.com' },
    })

    expect(prismaMock.auditLog.create).toHaveBeenCalledOnce()
    const data = prismaMock.auditLog.create.mock.calls[0][0].data

    // Regression guard: these fields do not exist on the Prisma model and
    // previously caused every audit write to fail silently at runtime.
    expect(data).not.toHaveProperty('entity')
    expect(data).not.toHaveProperty('oldData')
    expect(data).not.toHaveProperty('newData')

    expect(data.entityType).toBe('AuthLogin')
    expect(data.action).toBe(AuditAction.LOGIN)
    expect(data.metadata).toMatchObject({ newData: { email: 'a@b.com' } })
  })

  it('never throws even when the database write fails', async () => {
    prismaMock.auditLog.create.mockRejectedValue(new Error('db down'))
    await expect(
      createAuditLog({ action: AuditAction.CREATE, entity: 'X' })
    ).resolves.toBeUndefined()
  })
})
