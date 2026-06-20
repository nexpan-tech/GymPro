import { describe, it, expect, beforeAll } from 'vitest'
import crypto from 'crypto'

// Configure gateway secrets BEFORE importing the provider (read in constructor).
beforeAll(() => {
  process.env.RAZORPAY_KEY_ID = 'rzp_test_key'
  process.env.RAZORPAY_KEY_SECRET = 'test_secret'
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret'
})

describe('RazorpayProvider — signature verification (HMAC)', () => {
  it('verifyPayment accepts a correctly-signed handshake', async () => {
    const { RazorpayProvider } = await import('../../modules/payment/gateways/razorpay.provider.js')
    const p = new RazorpayProvider()
    const orderId = 'order_ABC'
    const paymentId = 'pay_XYZ'
    const signature = crypto.createHmac('sha256', 'test_secret').update(`${orderId}|${paymentId}`).digest('hex')
    expect(p.verifyPayment({ orderId, paymentId, signature })).toBe(true)
    expect(p.verifyPayment({ orderId, paymentId, signature: 'deadbeef' })).toBe(false)
  })

  it('verifyWebhookSignature validates HMAC over the raw body', async () => {
    const { RazorpayProvider } = await import('../../modules/payment/gateways/razorpay.provider.js')
    const p = new RazorpayProvider()
    const body = JSON.stringify({ event: 'payment.captured', payload: {} })
    const sig = crypto.createHmac('sha256', 'test_webhook_secret').update(body).digest('hex')
    expect(p.verifyWebhookSignature(body, sig)).toBe(true)
    expect(p.verifyWebhookSignature(body, 'wrong')).toBe(false)
    expect(p.verifyWebhookSignature('{"tampered":true}', sig)).toBe(false)
  })

  it('isConfigured reflects credentials', async () => {
    const { RazorpayProvider } = await import('../../modules/payment/gateways/razorpay.provider.js')
    expect(new RazorpayProvider().isConfigured()).toBe(true)
  })
})

describe('StripeProvider — stub', () => {
  it('is not configured and rejects verification', async () => {
    const { StripeProvider } = await import('../../modules/payment/gateways/stripe.provider.js')
    const s = new StripeProvider()
    expect(s.isConfigured()).toBe(false)
    expect(s.verifyPayment({ orderId: 'o', paymentId: 'p', signature: 's' })).toBe(false)
    await expect(s.createOrder({ amountInPaise: 100 })).rejects.toThrow(/not implemented/i)
  })
})

describe('getPaymentGateway selector', () => {
  it('returns Razorpay by default and Stripe when asked', async () => {
    const { getPaymentGateway } = await import('../../modules/payment/gateways/index.js')
    expect(getPaymentGateway().name).toBe('RAZORPAY')
    expect(getPaymentGateway('STRIPE').name).toBe('STRIPE')
    expect(getPaymentGateway('unknown').name).toBe('RAZORPAY')
  })
})
