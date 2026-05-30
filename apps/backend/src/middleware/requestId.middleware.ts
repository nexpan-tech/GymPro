import { randomUUID } from 'crypto'
import { Request, Response, NextFunction } from 'express'

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = randomUUID()
  req.id = id
  res.setHeader('X-Request-ID', id)
  next()
}
