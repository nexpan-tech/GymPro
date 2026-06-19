import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Role } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => {
  const prismaMock: any = {
    member: { findFirst: vi.fn() },
    attendance: { findMany: vi.fn() },
  }
  return { prismaMock }
})

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { AttendanceService } from '../../modules/attendance/attendance.service'

const GYM = 'gym-1'
const trainer = { id: 'tr-1', role: Role.TRAINER, gymId: GYM }
const admin = { id: 'admin-1', role: Role.ADMIN, gymId: GYM }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AttendanceService.getMemberAttendance — trainer isolation', () => {
  it('returns attendance for a member assigned to the trainer', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: GYM, trainerId: 'tr-1', userId: 'u1' })
    prismaMock.attendance.findMany.mockResolvedValue([{ id: 'a1' }])
    const rows = await AttendanceService.getMemberAttendance(trainer, 'm1')
    expect(rows).toEqual([{ id: 'a1' }])
    expect(prismaMock.attendance.findMany.mock.calls[0][0].where).toEqual({ gymId: GYM, memberId: 'm1' })
  })

  it('blocks a TRAINER from an unassigned member', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm2', gymId: GYM, trainerId: 'other', userId: 'u2' })
    await expect(AttendanceService.getMemberAttendance(trainer, 'm2')).rejects.toThrow(/assigned member attendance/i)
    expect(prismaMock.attendance.findMany).not.toHaveBeenCalled()
  })

  it('404s for a member outside the trainer’s gym', async () => {
    prismaMock.member.findFirst.mockResolvedValue(null)
    await expect(AttendanceService.getMemberAttendance(trainer, 'ghost')).rejects.toThrow(/not found/i)
  })

  it('lets ADMIN read any member in the gym', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm3', gymId: GYM, trainerId: 'whoever', userId: 'u3' })
    prismaMock.attendance.findMany.mockResolvedValue([])
    await expect(AttendanceService.getMemberAttendance(admin, 'm3')).resolves.toEqual([])
  })
})
