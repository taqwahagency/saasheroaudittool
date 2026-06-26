'use client'

import { useEffect, useState } from 'react'

const steps = [
  { label: 'Opening your website...', duration: 4000 },
  { label: 'Taking a snapshot of the hero...', duration: 4000 },
  { label: 'Pulling performance data...', duration: 5000 },
  { label: 'AI is reading your hero section...', duration: 8000 },
  { label: 'Putting the report together...', duration: 3000 },
]

export default function LoadingSteps() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    let elapsed = 0
    const timers: ReturnType<typeof setTimeout>[] = []

    steps.forEach((step, i) => {
      const timer = setTimeout(() => {
        setCurrentStep(i)
      }, elapsed)
      timers.push(timer)
      elapsed += step.duration
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      {/* Spinner */}
      <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {steps.map((step, i) => {
          const isDone = i < currentStep
          const isActive = i === currentStep

          return (
            <div
              key={i}
              className={`flex items-center gap-3 transition-all duration-500 ${
                isActive ? 'opacity-100' : isDone ? 'opacity-40' : 'opacity-20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs border ${
                  isDone
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                    ? 'border-violet-500 text-violet-400'
                    : 'border-white/20 text-white/20'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                className={`text-sm ${
                  isActive ? 'text-white font-medium' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-600 mt-2">This usually takes 20–30 seconds</p>
    </div>
  )
}
