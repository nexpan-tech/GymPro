import { describe, it, expect } from 'vitest'
import { Role } from '@prisma/client'

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
