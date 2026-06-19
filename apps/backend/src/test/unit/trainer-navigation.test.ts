import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Tests run from apps/backend, so the web app sits one level up.
const WEB_SRC = resolve(process.cwd(), '../web/src')

function trainerNavPaths(): string[] {
  const src = readFileSync(resolve(WEB_SRC, 'config/navigation.ts'), 'utf8')
  const start = src.indexOf('const TRAINER_NAV')
  const end = src.indexOf('];', start)
  const block = src.slice(start, end)
  return [...block.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1])
}

function routesSource(): string {
  return readFileSync(resolve(WEB_SRC, 'routes/index.tsx'), 'utf8')
}

describe('Trainer sidebar navigation integrity', () => {
  const paths = trainerNavPaths()

  it('has at least the core trainer destinations', () => {
    expect(paths).toContain('/trainer/dashboard')
    expect(paths).toContain('/trainer/workout-plans')
    expect(paths).toContain('/trainer/diet-plans')
    expect(paths).toContain('/trainer/attendance')
    expect(paths).toContain('/trainer/progress')
  })

  it('contains no duplicate nav entries (the Progress duplicate is removed)', () => {
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('has exactly one Member Progress destination', () => {
    expect(paths.filter((p) => p === '/trainer/progress')).toHaveLength(1)
  })

  it('hides Schedule + Notifications (no broken/unrouted links)', () => {
    expect(paths).not.toContain('/trainer/schedule')
    expect(paths).not.toContain('/trainer/notifications')
  })

  it('every trainer nav path has a matching route registered', () => {
    const routes = routesSource()
    for (const p of paths) {
      expect(p.startsWith('/trainer/')).toBe(true)
      const segment = p.replace('/trainer/', '')
      expect(routes).toContain(`path: "${segment}"`)
    }
  })
})
