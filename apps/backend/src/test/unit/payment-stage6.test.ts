import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => {
  const mock: any = {
    member: { findFirst: vi.fn() },
    gym: { findUnique: vi.fn() },
    payment: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    invoice: { create: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
    due: { findFirst: vi.fn(), update: vi.fn() },
    membership: { updateMany: vi.fn() },
  }
  mock.$transaction = vi.fn(async (fn: any) => fn(mock))
  return { prismaMock: mock }
})

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { createPayment } from '../../modules/payment/payment.service'

const GYM = 'gym-AAA111'

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.member.findFirst.mockResolvedValue({ id: 'm-1', gymId: GYM, user: { name: 'Asha' } })
  prismaMock.gym.findUnique.mockResolvedValue({ id: GYM, gstPercent: 18, stateCode: 'KA' })
  prismaMock.invoice.count.mockResolvedValue(0)
  prismaMock.invoice.create.mockImplementation(async ({ data }: any) => ({ id: 'inv-1', ...data }))
  prismaMock.payment.create.mockImplementation(async ({ data }: any) => ({ id: 'pay-1', ...data, member: { user: { name: 'Asha' } } }))
})

describe('createPayment (manual) — Stage 6 invoicing', () => {
  it('records a payment scoped to the gym with gateway MANUAL', async () => {
    await createPayment(GYM, { memberId: 'm-1', amount: 1180, method: 'CASH', status: 'PAID' })
    const arg = prismaMock.payment.create.mock.calls[0][0].data
    expect(arg.gymId).toBe(GYM)
    expect(arg.gateway).toBe('MANUAL')
    expect(arg.status).toBe('PAID')
  })

  it('generates a GST invoice for a PAID non-due payment', async () => {
    await createPayment(GYM, { memberId: 'm-1', amount: 1180, method: 'CASH', status: 'PAID' })
    expect(prismaMock.invoice.create).toHaveBeenCalledOnce()
    const inv = prismaMock.invoice.create.mock.calls[0][0].data
    expect(inv.paymentId).toBe('pay-1')
    expect(inv.totalAmount).toBe(1180)
    expect(inv.cgst + inv.sgst).toBeCloseTo(180, 1) // 18% of 1000 subtotal
  })

  it('does NOT invoice a partial due settlement', async () => {
    prismaMock.due.findFirst.mockResolvedValue({ id: 'due-1', gymId: GYM, memberId: 'm-1', amount: 2000, paidAmount: 0, status: 'PENDING' })
    await createPayment(GYM, { memberId: 'm-1', amount: 500, method: 'CASH', status: 'PAID', dueId: 'due-1' })
    expect(prismaMock.invoice.create).not.toHaveBeenCalled()
    expect(prismaMock.due.update).toHaveBeenCalledOnce()
  })

  it('rejects a member from another gym', async () => {
    prismaMock.member.findFirst.mockResolvedValue(null)
    await expect(createPayment(GYM, { memberId: 'x', amount: 100, method: 'CASH' })).rejects.toThrow(/not found in this gym/i)
  })
})
