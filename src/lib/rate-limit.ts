// Simple in-memory rate limiter — resets on server restart
// On VPS this persists as long as the process is running

interface RateLimitEntry {
  count: number
  firstRequest: number
  email?: string
}

const store = new Map<string, RateLimitEntry>()
const DAILY_MS = 24 * 60 * 60 * 1000
const MAX_PER_DAY = 2

function getEntry(ip: string): RateLimitEntry {
  const existing = store.get(ip)
  if (!existing) return { count: 0, firstRequest: Date.now() }

  // Reset if 24 hours have passed
  if (Date.now() - existing.firstRequest > DAILY_MS) {
    return { count: 0, firstRequest: Date.now() }
  }

  return existing
}

export function checkRateLimit(ip: string): {
  allowed: boolean
  count: number
  requiresEmail: boolean
  hasEmail: boolean
} {
  const entry = getEntry(ip)

  return {
    allowed: entry.count < MAX_PER_DAY,
    count: entry.count,
    requiresEmail: entry.count >= 1, // 2nd audit needs email
    hasEmail: !!entry.email,
  }
}

export function incrementUsage(ip: string): void {
  const entry = getEntry(ip)
  store.set(ip, {
    ...entry,
    count: entry.count + 1,
    firstRequest: entry.count === 0 ? Date.now() : entry.firstRequest,
  })
}

export function saveEmail(ip: string, email: string): void {
  const entry = getEntry(ip)
  store.set(ip, { ...entry, email })
}

export function getEmail(ip: string): string | undefined {
  return store.get(ip)?.email
}
