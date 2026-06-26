import { NextRequest, NextResponse } from 'next/server'
import { runAudit } from '@/lib/audit'
import { checkRateLimit, incrementUsage, getEmail } from '@/lib/rate-limit'

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const { url, email } = await req.json()

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  const rateCheck = checkRateLimit(ip)

  // If they've used their first audit, require email
  if (rateCheck.requiresEmail && !rateCheck.hasEmail) {
    if (!email) {
      return NextResponse.json(
        { error: 'email_required', message: 'Please enter your email to continue' },
        { status: 403 }
      )
    }
  }

  // Check if daily limit hit
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: 'limit_reached',
        message: "You've used your 2 free audits for today. Come back tomorrow!",
      },
      { status: 429 }
    )
  }

  try {
    // Save email if provided
    if (email) {
      const { saveEmail } = await import('@/lib/rate-limit')
      saveEmail(ip, email)

      // Optionally log email to a file on the VPS
      const fs = await import('fs/promises')
      const path = await import('path')
      const emailsPath = path.join(process.cwd(), 'emails.txt')
      await fs.appendFile(emailsPath, `${new Date().toISOString()} | ${email} | ${url}\n`)
    }

    const result = await runAudit(url)
    incrementUsage(ip)

    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('Audit error:', err)
    return NextResponse.json(
      { error: 'audit_failed', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
