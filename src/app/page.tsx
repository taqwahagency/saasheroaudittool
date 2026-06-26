'use client'

import { useState } from 'react'
import AuditResults from '@/components/hero-audit/AuditResults'
import LoadingSteps from '@/components/hero-audit/LoadingSteps'
import EmailGate from '@/components/hero-audit/EmailGate'
import { AuditResult } from '@/lib/audit'

type State = 'idle' | 'email_gate' | 'loading' | 'results' | 'error' | 'limit'

export default function HeroAuditPage() {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<AuditResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [pendingEmail, setPendingEmail] = useState(false)

  const runAudit = async (email?: string) => {
    setState('loading')

    try {
      const res = await fetch('/tools/saas-hero-audit/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, email }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'email_required') {
          setState('email_gate')
          setPendingEmail(true)
          return
        }
        if (data.error === 'limit_reached') {
          setState('limit')
          return
        }
        throw new Error(data.message || 'Something went wrong')
      }

      setResult(data.result)
      setState('results')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setState('error')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    runAudit()
  }

  const handleEmailSubmit = (email: string) => {
    runAudit(email)
  }

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setUrl('')
    setErrorMsg('')
    setPendingEmail(false)
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      {/* Email gate modal */}
      {state === 'email_gate' && <EmailGate onSubmit={handleEmailSubmit} />}

      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-gray-500">
          <span>Tools</span>
          <span>/</span>
          <span className="text-white">Hero Audit</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero input — shown when idle or error */}
        {(state === 'idle' || state === 'error') && (
          <div className="flex flex-col items-center text-center gap-8 mb-12">
            {/* Badge */}
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Free SaaS Hero Audit
            </span>

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                How good is your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                  hero section?
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Paste your SaaS website URL and get an honest, detailed score across
                messaging, conversion, and performance.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-xl">
              <div className="flex gap-3 flex-col sm:flex-row">
                <input
                  type="text"
                  placeholder="https://yoursaas.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                />
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-6 py-3.5 rounded-xl text-sm transition-colors flex-shrink-0"
                >
                  Audit Hero →
                </button>
              </div>

              {state === 'error' && (
                <p className="text-red-400 text-sm mt-3 text-left">{errorMsg}</p>
              )}
            </form>

            {/* Trust line */}
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span>✦ Free</span>
              <span>✦ SaaS-focused</span>
              <span>✦ AI-powered</span>
              <span>✦ 2 audits/day</span>
            </div>
          </div>
        )}

        {/* Loading */}
        {state === 'loading' && <LoadingSteps />}

        {/* Limit reached */}
        {state === 'limit' && (
          <div className="flex flex-col items-center text-center gap-4 py-16">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-2xl">
              ⏳
            </div>
            <h2 className="text-xl font-semibold text-white">
              You&apos;ve used your 2 free audits today
            </h2>
            <p className="text-gray-400 text-sm max-w-sm">
              Come back tomorrow for 2 more. Your results are saved above if you need
              to revisit them.
            </p>
            <button
              onClick={handleReset}
              className="text-sm text-violet-400 hover:text-violet-300 mt-2"
            >
              ← Go back
            </button>
          </div>
        )}

        {/* Results */}
        {state === 'results' && result && (
          <AuditResults result={result} onReset={handleReset} />
        )}
      </div>
    </div>
  )
}
