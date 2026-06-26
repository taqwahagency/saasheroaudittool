'use client'

import { useRef, useState } from 'react'
import { AuditResult } from '@/lib/audit'
import ScoreRing from './ScoreRing'
import ScoreBadge from './ScoreBadge'

interface AuditResultsProps {
  result: AuditResult
  onReset: () => void
}

export default function AuditResults({ result, onReset }: AuditResultsProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return
    setDownloading(true)

    try {
      const { domToCanvas } = await import('modern-screenshot')
      const { jsPDF } = await import('jspdf')

      const canvas = await domToCanvas(reportRef.current, {
        backgroundColor: '#080a0f',
        scale: 2,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      const hostname = result.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
      pdf.save(`hero-audit-${hostname}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Hero Audit Report</h2>
          <p className="text-sm text-gray-500 mt-1 break-all">{result.url}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="text-sm text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            {downloading ? 'Preparing PDF...' : '⬇ Download PDF'}
          </button>
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-colors"
          >
            ← Audit another
          </button>
        </div>
      </div>

      <div ref={reportRef} className="flex flex-col gap-8 p-2">
      {/* Screenshot + Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Screenshot */}
        <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
          <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-gray-600 truncate">{result.url}</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${result.screenshotBase64}`}
            alt="Hero screenshot"
            className="w-full"
          />
        </div>

        {/* Score */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-6">
          <ScoreRing score={result.overallScore} />
          <div className="text-center">
            <p className="text-sm text-gray-400">Overall Hero Score</p>
            <p className="text-xs text-gray-600 mt-1">Based on 11 criteria</p>
          </div>

          {/* Mini score breakdown */}
          <div className="w-full grid grid-cols-3 gap-2 text-center">
            {[
              {
                label: 'Messaging',
                scores: Object.values(result.messaging).map((c) => c.score),
              },
              {
                label: 'Conversion',
                scores: Object.values(result.conversion).map((c) => c.score),
              },
              {
                label: 'Technical',
                scores: Object.values(result.technical).map((c) => c.score),
              },
            ].map(({ label, scores }) => {
              const avg = Math.round(
                (scores.reduce((a, b) => a + b, 0) / scores.length) * 10
              )
              const color =
                avg >= 75 ? 'text-green-400' : avg >= 50 ? 'text-amber-400' : 'text-red-400'
              return (
                <div key={label} className="bg-white/5 rounded-lg py-2 px-1">
                  <div className={`text-lg font-bold ${color}`}>{avg}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Messaging */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
            Messaging
          </h3>
          <ScoreBadge
            score={result.messaging.headlineClarity.score}
            label="Headline Clarity"
            feedback={result.messaging.headlineClarity.feedback}
          />
          <ScoreBadge
            score={result.messaging.valueProposition.score}
            label="Value Proposition"
            feedback={result.messaging.valueProposition.feedback}
          />
          <ScoreBadge
            score={result.messaging.targetAudience.score}
            label="Target Audience"
            feedback={result.messaging.targetAudience.feedback}
          />
          <ScoreBadge
            score={result.messaging.supportingCopy.score}
            label="Supporting Copy"
            feedback={result.messaging.supportingCopy.feedback}
          />
        </div>

        {/* Conversion */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
            Conversion
          </h3>
          <ScoreBadge
            score={result.conversion.ctaStrength.score}
            label="CTA Strength"
            feedback={result.conversion.ctaStrength.feedback}
          />
          <ScoreBadge
            score={result.conversion.aboveFold.score}
            label="Above the Fold"
            feedback={result.conversion.aboveFold.feedback}
          />
          <ScoreBadge
            score={result.conversion.socialProof.score}
            label="Social Proof"
            feedback={result.conversion.socialProof.feedback}
          />
          <ScoreBadge
            score={result.conversion.trustSignals.score}
            label="Trust Signals"
            feedback={result.conversion.trustSignals.feedback}
          />
        </div>

        {/* Technical */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
            Technical
          </h3>
          <ScoreBadge
            score={result.technical.lcpSpeed.score}
            label="Load Speed (LCP)"
            feedback={result.technical.lcpSpeed.feedback}
          />
          <ScoreBadge
            score={result.technical.mobileResponsiveness.score}
            label="Mobile Performance"
            feedback={result.technical.mobileResponsiveness.feedback}
          />
          <ScoreBadge
            score={result.technical.imageOptimization.score}
            label="Image Optimization"
            feedback={result.technical.imageOptimization.feedback}
          />
        </div>
      </div>
      </div>
    </div>
  )
}
