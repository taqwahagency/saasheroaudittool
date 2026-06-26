'use client'

interface ScoreRingProps {
  score: number
}

export default function ScoreRing({ score }: ScoreRingProps) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const offset = circumference - progress

  const getColor = (s: number) => {
    if (s >= 75) return '#22c55e' // green
    if (s >= 50) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  const getLabel = (s: number) => {
    if (s >= 75) return 'Strong'
    if (s >= 50) return 'Average'
    return 'Needs Work'
  }

  const color = getColor(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          {/* Background ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth="10"
          />
          {/* Progress ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      <span
        className="text-sm font-semibold px-3 py-1 rounded-full"
        style={{ color, backgroundColor: `${color}20` }}
      >
        {getLabel(score)}
      </span>
    </div>
  )
}
