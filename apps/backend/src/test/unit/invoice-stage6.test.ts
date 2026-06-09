import { describe, it, expect, vi } from 'vitest'
import { computeGst, InvoiceService } from '../../modules/invoice/invoice.service'

describe('computeGst — GST split (amount is GST-inclusive)', () => {
  it('intra-state splits CGST + SGST', () => {
    const g = computeGst(118, 18, false)
    expect(g.subtotal).toBe(100)
    expect(g.gstAmount).toBe(18)
    expect(g.cgst).toBe(9)
    expect(g.sgst).toBe(9)
    expect(g.igst).toBe(0)
    expect(g.totalAmount).toBe(118)
  })

  it('inter-state uses IGST', () => {
    const g = computeGst(118, 18, true)
    expect(g.igst).toBe(18)
    expect(g.cgst).toBe(0)
    expect(g.sgst).toBe(0)
    expect(g.subtotal).toBe(100)
  })

  it('0% GST yields no tax', () => {
    const g = computeGst(100, 0)
    expect(g.subtotal).toBe(100)
    expect(g.gstAmount).toBe(0)
    expect(g.totalAmount).toBe(100)
  })
})

describe('InvoiceService.generate', () => {
  const makeDb = (gym: any, count = 0) => ({
    gym: { findUnique: vi.fn().mockResolvedValue(gym) },
    invoice: {
      count: vi.fn().mockResolvedValue(count),
      create: vi.fn().mockImplementation(async ({ data }: any) => ({ id: 'inv-1', ...data })),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    member: { findFirst: vi.fn() },
  })

  it('generates a numbered invoice with gym GST %, no photo/PDF fields', async () => {
    const db = makeDb({ id: 'gym-123456', gstPercent: 18, stateCode: 'KA' }, 4)
    const inv: any = await InvoiceService.generate(
      { gymId: 'gym-123456', memberId: 'm-1', amount: 118, customerName: 'Asha' },
      db as never,
    )
    expect(inv.invoiceNumber).toBe('INV-123456-00005') // count 4 → seq 5
    expect(inv.cgst).toBe(9)
    expect(inv.sgst).toBe(9)
    expect(inv.totalAmount).toBe(118)
    expect(inv.customerName).toBe('Asha')
    expect(inv).not.toHaveProperty('imageUrl')
  })

  it('uses IGST when customer state differs from gym state', async () => {
    const db = makeDb({ id: 'gymxyz', gstPercent: 18, stateCode: 'KA' }, 0)
    const inv: any = await InvoiceService.generate(
      { gymId: 'gymxyz', memberId: 'm-1', amount: 118, customerName: 'B', customerStateCode: 'MH' },
      db as never,
    )
    expect(inv.igst).toBe(18)
    expect(inv.cgst).toBe(0)
  })
})
