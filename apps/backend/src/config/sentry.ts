import * as Sentry from '@sentry/node'

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '1.0.0',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [Sentry.httpIntegration()],
    beforeSend: function(event) {
      const url = (event.request && event.request.url) || ''
      if (url.includes('/health') || url.includes('/metrics')) return null
      return event
    },
  })
}

export function setSentryUserContext(userId: string | undefined, gymId: string | undefined): void {
  Sentry.setUser(userId ? { id: userId } : null)
  if (gymId) Sentry.setTag('gymId', gymId)
}

export { Sentry }
