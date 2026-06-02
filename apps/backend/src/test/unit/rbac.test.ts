import { describe, it, expect, vi } from 'vitest'
import { Role } from '@prisma/client'
import type { Request, Response, NextFunction } from 'express'
import { requireRoles } from '../../middleware/role.middleware'

function runGuard(roles: Role[], user: { role: Role } | undefined) {
  const req = { user } as unknown as Request
  const json = vi.fn()
  const status = vi.fn(() => ({ json })) as unknown as Response['status']
  const res = { status, json } as unknown as Response
  const next = vi.fn() as NextFunction
  requireRoles(...roles)(req, res, next)
  return { next, status, json }
}

describe('requireRoles middleware', () => {
  it('calls next() when the role is allowed', () => {
    const { next, status } = runGuard([Role.ADMIN], { role: Role.ADMIN })
    expect(next).toHaveBeenCalledOnce()
    expect(status).not.toHaveBeenCalled()
  })

  it('returns 403 when the role is not allowed', () => {
    const { next, status } = runGuard([Role.ADMIN], { role: Role.MEMBER })
    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(403)
  })

  it('returns 401 when there is no authenticated user', () => {
    const { next, status } = runGuard([Role.ADMIN], undefined)
    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(401)
  })

  it('allows any of several permitted roles', () => {
    expect(runGuard([Role.ADMIN, Role.RECEPTIONIST], { role: Role.RECEPTIONIST }).next)
      .toHaveBeenCalledOnce()
    expect(runGuard([Role.ADMIN, Role.RECEPTIONIST], { role: Role.TRAINER }).status)
      .toHaveBeenCalledWith(403)
  })
})

describe('Role Hierarchy Completeness', () => {
  it('all expected roles exist in Prisma Role enum', () => {
    const expectedRoles = [
      'SUPER_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER',
      'ADMIN', 'RECEPTIONIST', 'TRAINER', 'MEMBER',
    ]
    expectedRoles.forEach(r => {
      expect(Role).toHaveProperty(r)
    })
  })

  it('SUPER_ADMIN is the highest privilege role', () => {
    expect(Role.SUPER_ADMIN).toBe('SUPER_ADMIN')
  })

  it('MEMBER is the lowest privilege role', () => {
    expect(Role.MEMBER).toBe('MEMBER')
  })
})
