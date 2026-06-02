import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'

const { gymServiceMock, branchServiceMock, auditMock } = vi.hoisted(() => ({
  gymServiceMock: { create: vi.fn() },
  branchServiceMock: { create: vi.fn() },
  auditMock: { createAuditLog: vi.fn() },
}))

vi.mock('../../modules/gym/gym.service', () => ({ GymService: gymServiceMock }))
vi.mock('../../modules/branch/branch.service', () => ({ BranchService: branchServiceMock }))
vi.mock('../../utils/audit', () => auditMock)

import { GymController } from '../../modules/gym/gym.controller'
import { BranchController } from '../../modules/branch/branch.controller'

function mockRes() {
  const res: Partial<Response> = {}
  res.status = vi.fn().mockReturnValue(res) as unknown as Response['status']
  res.json = vi.fn().mockReturnValue(res) as unknown as Response['json']
  return res as Response
}

beforeEach(() => {
  vi.clearAllMocks()
  auditMock.createAuditLog.mockResolvedValue(undefined)
})

describe('Gym creation audit', () => {
  it('writes a CREATE audit log for the Gym entity', async () => {
    gymServiceMock.create.mockResolvedValue({ gym: { id: 'gym-9', name: 'Titan' }, admin: null })
    const req = {
      body: { name: 'Titan Fitness', email: 'titan@gym.com' },
      user: { id: 'super-1', gymId: null },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as Request

    await GymController.create(req, mockRes())

    expect(auditMock.createAuditLog).toHaveBeenCalledOnce()
    const arg = auditMock.createAuditLog.mock.calls[0][0]
    expect(arg.action).toBe('CREATE')
    expect(arg.entity).toBe('Gym')
    expect(arg.entityId).toBe('gym-9')
  })
})

describe('Branch creation audit', () => {
  it('writes a CREATE audit log for the Branch entity', async () => {
    branchServiceMock.create.mockResolvedValue({ id: 'branch-3', name: 'Salem' })
    const req = {
      body: { name: 'Salem', code: 'SALEM-1' },
      user: { id: 'admin-1', gymId: 'gym-9' },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as Request

    await BranchController.create(req, mockRes())

    expect(auditMock.createAuditLog).toHaveBeenCalledOnce()
    const arg = auditMock.createAuditLog.mock.calls[0][0]
    expect(arg.action).toBe('CREATE')
    expect(arg.entity).toBe('Branch')
    expect(arg.entityId).toBe('branch-3')
    expect(arg.gymId).toBe('gym-9')
  })
})
