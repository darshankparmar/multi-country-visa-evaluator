import React, { useMemo } from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({
  value,
  max = 100,
  showLabel = true,
  className = ''
}) => {
  // Memoize percentage calculation
  const percentage = useMemo(() => 
    Math.min(Math.max((value / max) * 100, 0), 100),
    [value, max]
  )
  
  // Memoize color classes
  const colorClass = useMemo(() => {
    if (percentage >= 70) return 'bg-green-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }, [percentage])
  
  const textColorClass = useMemo(() => {
    if (percentage >= 70) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }, [percentage])
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className={`text-sm font-semibold ${textColorClass}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
})
