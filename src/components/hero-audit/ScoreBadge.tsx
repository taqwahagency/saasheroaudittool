interface ScoreBadgeProps {
  score: number
  label: string
  feedback: string
}

export default function ScoreBadge({ score, label, feedback }: ScoreBadgeProps) {
  const getColors = (s: number) => {
    if (s >= 8) return { dot: 'bg-green-500', badge: 'text-green-400 bg-green-500/10', bar: 'bg-green-500' }
    if (s >= 5) return { dot: 'bg-amber-500', badge: 'text-amber-400 bg-amber-500/10', bar: 'bg-amber-500' }
    return { dot: 'bg-red-500', badge: 'text-red-400 bg-red-500/10', bar: 'bg-red-500' }
  }

  const colors = getColors(score)

  return (
    <div className="py-5 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <span className={`text-sm font-bold px-2 py-0.5 rounded ${colors.badge}`}>
          {score}/10
        </span>
      </div>

      {/* Score bar */}
      <div className="h-1 bg-white/5 rounded-full mb-3 ml-4">
        <div
          className={`h-full rounded-full ${colors.bar}`}
          style={{ width: `${score * 10}%`, transition: 'width 0.8s ease' }}
        />
      </div>

      {/* Feedback */}
      <p className="text-sm text-gray-400 leading-relaxed ml-4">{feedback}</p>
    </div>
  )
}
