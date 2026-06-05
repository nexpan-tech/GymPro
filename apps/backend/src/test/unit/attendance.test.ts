import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Role } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    member: { findFirst: vi.fn() },
    membership: { findFirst: vi.fn() },
    attendance: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    gym: { findUnique: vi.fn() },
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../realtime/socket', () => ({ emitToGym: vi.fn() }))

import { AttendanceService } from '../../modules/attendance/attendance.service'

const GYM = 'gym-1'
const member = { id: 'm1', userId: 'u1', gymId: GYM, branchId: 'b1', trainerId: null }
const memberUser = { id: 'u1', role: Role.MEMBER, gymId: GYM }
const admin = { id: 'a1', role: Role.ADMIN, gymId: GYM }

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.attendance.count.mockResolvedValue(1)
  prismaMock.attendance.create.mockImplementation(async ({ data }: any) => ({ id: 'att-1', ...data }))
  prismaMock.attendance.update.mockImplementation(async ({ data }: any) => ({ id: 'att-1', gymId: GYM, ...data }))
})

describe('checkIn (QR scan)', () => {
  it('creates attendance for a valid scan with active membership', async () => {
    prismaMock.member.findFirst.mockResolvedValue(member)
    prismaMock.membership.findFirst.mockResolvedValue({ id: 'ms1' })
    prismaMock.attendance.findFirst.mockResolvedValue(null)

    const res = await AttendanceService.checkIn(memberUser, GYM)

    expect(res.alreadyCheckedIn).toBe(false)
    const created = prismaMock.attendance.create.mock.calls[0][0].data
    expect(created.gymId).toBe(GYM)
    expect(created.memberId).toBe('m1')
    expect(created.source).toBe('QR')
    expect(created.status).toBe('CHECKED_IN')
  })

  it('rejects a QR from another gym', async () => {
    await expect(AttendanceService.checkIn(memberUser, 'other-gym')).rejects.toThrow(
      /not assigned to this gym|Invalid gym QR/i
    )
    expect(prismaMock.attendance.create).not.toHaveBeenCalled()
  })

  it('rejects a non-member role', async () => {
    await expect(AttendanceService.checkIn(admin, GYM)).rejects.toThrow(/Only members/i)
  })

  it('rejects when the member has no active membership', async () => {
    prismaMock.member.findFirst.mockResolvedValue(member)
    prismaMock.membership.findFirst.mockResolvedValue(null) // no active membership
    await expect(AttendanceService.checkIn(memberUser, GYM)).rejects.toThrow(/active membership/i)
    expect(prismaMock.attendance.create).not.toHaveBeenCalled()
  })

  it('returns the existing record (no duplicate) when already checked in', async () => {
    prismaMock.member.findFirst.mockResolvedValue(member)
    prismaMock.membership.findFirst.mockResolvedValue({ id: 'ms1' })
    prismaMock.attendance.findFirst.mockResolvedValue({ id: 'att-1', status: 'CHECKED_IN' })

    const res = await AttendanceService.checkIn(memberUser, GYM)
    expect(res.alreadyCheckedIn).toBe(true)
    expect(prismaMock.attendance.create).not.toHaveBeenCalled()
  })

  it('blocks a second session after checkout the same day', async () => {
    prismaMock.member.findFirst.mockResolvedValue(member)
    prismaMock.membership.findFirst.mockResolvedValue({ id: 'ms1' })
    prismaMock.attendance.findFirst.mockResolvedValue({ id: 'att-1', status: 'CHECKED_OUT' })

    await expect(AttendanceService.checkIn(memberUser, GYM)).rejects.toThrow(/already completed/i)
  })
})

describe('checkOut', () => {
  it('checks out an active session', async () => {
    prismaMock.member.findFirst.mockResolvedValue(member)
    prismaMock.attendance.findFirst.mockResolvedValue({ id: 'att-1', status: 'CHECKED_IN' })

    const res = await AttendanceService.checkOut(memberUser)
    const data = prismaMock.attendance.update.mock.calls[0][0].data
    expect(data.status).toBe('CHECKED_OUT')
    expect(data.checkOutAt).toBeInstanceOf(Date)
    expect(res.attendance.status).toBe('CHECKED_OUT')
  })

  it('errors when there is no active check-in', async () => {
    prismaMock.member.findFirst.mockResolvedValue(member)
    prismaMock.attendance.findFirst.mockResolvedValue(null)
    await expect(AttendanceService.checkOut(memberUser)).rejects.toThrow(/No active check-in/i)
  })

  it('checks out when the scanned gym QR matches the member gym', async () => {
    prismaMock.member.findFirst.mockResolvedValue(member)
    prismaMock.attendance.findFirst.mockResolvedValue({ id: 'att-1', status: 'CHECKED_IN' })
    const res = await AttendanceService.checkOut(memberUser, GYM)
    expect(res.attendance.status).toBe('CHECKED_OUT')
  })

  it('rejects checkout when the scanned gym QR is for another gym', async () => {
    await expect(AttendanceService.checkOut(memberUser, 'other-gym')).rejects.toThrow(
      /not assigned to this gym|Invalid gym QR/i,
    )
    expect(prismaMock.attendance.update).not.toHaveBeenCalled()
  })
})

describe('tenant isolation + roles', () => {
  it('daily attendance is scoped to the caller gym', async () => {
    prismaMock.attendance.findMany.mockResolvedValue([])
    await AttendanceService.getDailyAttendance(admin)
    expect(prismaMock.attendance.findMany.mock.calls[0][0].where.gymId).toBe(GYM)
  })

  it('members cannot view daily attendance', async () => {
    await expect(AttendanceService.getDailyAttendance(memberUser)).rejects.toThrow(/admin or receptionist/i)
  })

  it('getMemberAttendance scopes the member lookup by gym', async () => {
    prismaMock.member.findFirst.mockResolvedValue(member)
    prismaMock.attendance.findMany.mockResolvedValue([])
    await AttendanceService.getMemberAttendance(admin, 'm1')
    expect(prismaMock.member.findFirst.mock.calls[0][0].where).toMatchObject({ id: 'm1', gymId: GYM })
  })
})

describe('analytics + live', () => {
  it('returns the expected analytics shape', async () => {
    prismaMock.attendance.findMany.mockResolvedValue([])
    prismaMock.attendance.count.mockResolvedValue(0)
    const a = await AttendanceService.getAnalytics(admin, 7)
    expect(a).toHaveProperty('todayCheckIns')
    expect(a).toHaveProperty('currentOccupancy')
    expect(a).toHaveProperty('avgDailyAttendance')
    expect(a.trend).toHaveLength(7)
    expect(Array.isArray(a.peakHours)).toBe(true)
  })

  it('live returns occupancy count', async () => {
    prismaMock.attendance.findMany.mockResolvedValue([{ id: 'x' }, { id: 'y' }])
    const live = await AttendanceService.getLive(admin)
    expect(live.occupancy).toBe(2)
  })
})
