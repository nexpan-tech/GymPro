import { Request, Response, NextFunction } from 'express'
import { setSentryUserContext } from '../config/sentry'

export function sentryContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user
  if (user) {
    setSentryUserContext(user.id, user.gymId)
  }
  next()
}
