import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock, orchestratorMock, socketMock } = vi.hoisted(() => ({
  prismaMock: {
    announcement: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    announcementReceipt: { createMany: vi.fn().mockResolvedValue({ count: 2 }), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
  orchestratorMock: { resolveAudience: vi.fn(), dispatch: vi.fn().mockResolvedValue({ sent: 2, skipped: 0, failed: 0, total: 2 }) },
  socketMock: { emitAnnouncement: vi.fn(), emitToGym: vi.fn(), emitToUser: vi.fn() },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../modules/comms/orchestrator.service', () => ({ CommunicationOrchestrator: orchestratorMock }))
vi.mock('../../realtime/socket', () => socketMock)

import { AnnouncementService } from '../../modules/announcement/announcement.service'

const admin = { id: 'admin1', role: 'ADMIN', gymId: 'g1' }
beforeEach(() => vi.clearAllMocks())

describe('AnnouncementService (Stage 9)', () => {
  it('send resolves audience → receipts → dispatch → SENT + emits', async () => {
    prismaMock.announcement.findFirst.mockResolvedValue({ id: 'a1', gymId: 'g1', status: 'DRAFT', audience: 'MEMBERS', branchId: null, memberIds: [], channels: ['EMAIL'], title: 'T', message: 'M', priority: 'NORMAL' })
    orchestratorMock.resolveAudience.mockResolvedValue([{ userId: 'u1', memberId: 'm1' }, { userId: 'u2', memberId: 'm2' }])
    prismaMock.announcement.update.mockResolvedValue({ id: 'a1', status: 'SENT' })

    const res = await AnnouncementService.send(admin, 'a1')

    expect(orchestratorMock.resolveAudience).toHaveBeenCalledWith('g1', 'MEMBERS', { branchId: null, memberIds: [] })
    expect(prismaMock.announcementReceipt.createMany).toHaveBeenCalled()
    const channels = orchestratorMock.dispatch.mock.calls[0][0].channels
    expect(channels).toEqual(expect.arrayContaining(['IN_APP', 'SOCKET', 'EMAIL']))
    expect(prismaMock.announcement.update.mock.calls[0][0].data.status).toBe('SENT')
    expect(socketMock.emitAnnouncement).toHaveBeenCalled()
    expect(res.recipients).toBe(2)
  })

  it('cannot re-send an already SENT announcement', async () => {
    prismaMock.announcement.findFirst.mockResolvedValue({ id: 'a1', gymId: 'g1', status: 'SENT' })
    await expect(AnnouncementService.send(admin, 'a1')).rejects.toThrow()
  })

  it('TENANT ISOLATION: cannot send another gym\'s announcement', async () => {
    prismaMock.announcement.findFirst.mockResolvedValue(null)
    await expect(AnnouncementService.send(admin, 'aX')).rejects.toThrow()
    expect(orchestratorMock.dispatch).not.toHaveBeenCalled()
  })

  it('listMine returns targeted announcements with unread count', async () => {
    const member = { id: 'u9', role: 'MEMBER', gymId: 'g1' }
    prismaMock.announcementReceipt.findMany.mockResolvedValue([
      { id: 'r1', readAt: null, announcement: { id: 'a1', title: 'T1', message: 'M1', priority: 'HIGH', sentAt: new Date(), createdBy: { name: 'Admin' } } },
      { id: 'r2', readAt: new Date(), announcement: { id: 'a2', title: 'T2', message: 'M2', priority: 'NORMAL', sentAt: new Date(), createdBy: { name: 'Admin' } } },
    ])
    const res = await AnnouncementService.listMine(member)
    expect(res.items).toHaveLength(2)
    expect(res.unreadCount).toBe(1)
  })

  it('markRead stamps the receipt readAt (idempotent if already read)', async () => {
    const member = { id: 'u9', role: 'MEMBER', gymId: 'g1' }
    prismaMock.announcementReceipt.findFirst.mockResolvedValue({ id: 'r1', readAt: null })
    prismaMock.announcementReceipt.update.mockResolvedValue({ id: 'r1', readAt: new Date() })
    await AnnouncementService.markRead(member, 'a1')
    expect(prismaMock.announcementReceipt.update).toHaveBeenCalled()
  })
})
