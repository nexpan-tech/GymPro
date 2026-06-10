import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication requests. Try again later.' },
})

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload rate limit exceeded.' },
})

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'API rate limit exceeded.' },
})

// ── Stage 10 — targeted limiters for sensitive endpoints ──
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment requests. Slow down.' },
})

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // ~1 msg/sec sustained
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'You are sending messages too quickly.' },
})

export const broadcastLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30, // broadcasts/announcements are heavy fan-outs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Broadcast rate limit exceeded.' },
})
