import React from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = true,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const getColorClass = (percent: number) => {
    if (percent >= 70) return 'bg-green-500'
    if (percent >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }
  
  const getTextColorClass = (percent: number) => {
    if (percent >= 70) return 'text-green-600'
    if (percent >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className={`text-sm font-semibold ${getTextColorClass(percentage)}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getColorClass(percentage)}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}
