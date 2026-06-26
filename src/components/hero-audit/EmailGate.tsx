'use client'

import { useState } from 'react'

interface EmailGateProps {
  onSubmit: (email: string) => void
}

export default function EmailGate({ onSubmit }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    onSubmit(email)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
            <span className="text-xl">✉️</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            One more audit left for today
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Drop your email to run your second audit. We don&apos;t send newsletters or
            spam — just keeping things fair.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            Continue →
          </button>
        </form>

        <p className="text-gray-600 text-xs text-center mt-4">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  )
}
