import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock, socketMock } = vi.hoisted(() => ({
  prismaMock: {
    member: { findFirst: vi.fn() },
    trainerMessage: { create: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
  },
  socketMock: { emitChatMessage: vi.fn(), emitToUser: vi.fn(), emitToStaff: vi.fn() },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../realtime/socket', () => socketMock)

import { CommunicationService } from '../../modules/communication/communication.service'

const trainer = { id: 'tr1', role: 'TRAINER', gymId: 'g1' }
const member = { id: 'mu1', role: 'MEMBER', gymId: 'g1' }
beforeEach(() => vi.clearAllMocks())

describe('Trainer-member chat (Stage 9)', () => {
  it('trainer messages an ASSIGNED member → persisted + realtime to both', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: 'g1', trainerId: 'tr1', userId: 'mu1', user: {}, trainer: {} })
    prismaMock.trainerMessage.create.mockResolvedValue({ id: 'msg1', gymId: 'g1', memberId: 'm1', trainerId: 'tr1', senderId: 'tr1', type: 'TEXT', message: 'hi', createdAt: new Date() })

    await CommunicationService.sendMessage(trainer, { memberId: 'm1', message: 'hi' })
    expect(prismaMock.trainerMessage.create).toHaveBeenCalled()
    const [userIds] = socketMock.emitChatMessage.mock.calls[0]
    expect(userIds).toEqual(expect.arrayContaining(['tr1', 'mu1']))
  })

  it('PERMISSION: trainer cannot message a member assigned to another trainer', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: 'g1', trainerId: 'OTHER', userId: 'mu1', user: {}, trainer: {} })
    await expect(CommunicationService.sendMessage(trainer, { memberId: 'm1', message: 'x' })).rejects.toThrow()
    expect(prismaMock.trainerMessage.create).not.toHaveBeenCalled()
  })

  it('PERMISSION: member can only access their own thread', async () => {
    // getMemberAccess: member role + member.userId !== user.id → blocked.
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: 'g1', trainerId: 'tr1', userId: 'SOMEONE_ELSE', user: {}, trainer: {} })
    await expect(CommunicationService.sendMessage(member, { memberId: 'm1', message: 'x' })).rejects.toThrow()
  })

  it('markThreadRead marks the OTHER party messages read + emits read receipt', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: 'g1', trainerId: 'tr1', userId: 'mu1', user: {}, trainer: {} })
    prismaMock.trainerMessage.updateMany.mockResolvedValue({ count: 3 })
    const res = await CommunicationService.markThreadRead(member, 'm1')
    expect(res.updated).toBe(3)
    // marks messages NOT sent by the caller.
    expect(prismaMock.trainerMessage.updateMany.mock.calls[0][0].where.senderId).toEqual({ not: 'mu1' })
    expect(socketMock.emitToUser).toHaveBeenCalled()
  })
})
