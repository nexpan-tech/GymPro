import { Request, Response, NextFunction } from 'express'
import { redisClient } from '../config/redis'

const MAX_ATTEMPTS = parseInt(process.env.BRUTE_MAX_ATTEMPTS || '10')
const WINDOW_SECONDS = parseInt(process.env.BRUTE_WINDOW_SECONDS || '900')

export async function bruteForceProtection(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip ?? 'unknown'
  const key = 'brute:ip:' + ip
  try {
    const count = await redisClient.incr(key)
    if (count === 1) {
      await redisClient.expire(key, WINDOW_SECONDS)
    }
    if (count > MAX_ATTEMPTS) {
      const ttl = await redisClient.ttl(key)
      res.setHeader('Retry-After', String(ttl > 0 ? ttl : WINDOW_SECONDS))
      res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please try again later.',
        retryAfter: ttl > 0 ? ttl : WINDOW_SECONDS,
      })
      return
    }
    next()
  } catch (err) {
    // Fail open — Redis errors must not block legitimate traffic
    next()
  }
}

export async function clearBruteForce(ip: string): Promise<void> {
  try {
    await redisClient.del('brute:ip:' + ip)
  } catch (err) {
    // ignore
  }
}
