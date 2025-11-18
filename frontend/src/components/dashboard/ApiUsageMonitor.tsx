import React from 'react'

interface RateLimitInfo {
  limit: number
  remaining: number
  reset: string
}

interface ApiUsageMonitorProps {
  rateLimitInfo: RateLimitInfo | null
}

export const ApiUsageMonitor: React.FC<ApiUsageMonitorProps> = ({ rateLimitInfo }) => {
  if (!rateLimitInfo) {
    return null
  }

  const { limit, remaining, reset } = rateLimitInfo
  const used = limit - remaining
  const usagePercentage = (used / limit) * 100
  const resetDate = new Date(reset)
  const now = new Date()
  const timeUntilReset = Math.max(0, resetDate.getTime() - now.getTime())
  const minutesUntilReset = Math.ceil(timeUntilReset / 60000)

  // Determine status color based on usage
  const getStatusColor = () => {
    if (usagePercentage >= 90) return 'red'
    if (usagePercentage >= 70) return 'yellow'
    return 'green'
  }

  const statusColor = getStatusColor()

  const colorClasses = {
    red: {
      bg: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-900',
      bar: 'bg-red-500',
      icon: 'text-red-600'
    },
    yellow: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-500',
      text: 'text-yellow-900',
      bar: 'bg-yellow-500',
      icon: 'text-yellow-600'
    },
    green: {
      bg: 'bg-green-100',
      border: 'border-green-500',
      text: 'text-green-900',
      bar: 'bg-green-500',
      icon: 'text-green-600'
    }
  }

  const colors = colorClasses[statusColor]

  return (
    <div className={`${colors.bg} border-l-4 ${colors.border} rounded-lg p-4 sm:p-6 mb-8`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.icon} mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className={`text-base sm:text-lg font-semibold ${colors.text}`}>API Usage</h3>
        </div>
        {usagePercentage >= 70 && (
          <span className={`text-xs sm:text-sm font-medium ${colors.text}`}>
            {usagePercentage >= 90 ? 'Critical' : 'Warning'}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Usage Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Requests Used</p>
            <p className={`text-xl sm:text-2xl font-bold ${colors.text}`}>
              {used} / {limit}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Remaining</p>
            <p className={`text-xl sm:text-2xl font-bold ${colors.text}`}>
              {remaining}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Resets In</p>
            <p className={`text-xl sm:text-2xl font-bold ${colors.text}`}>
              {minutesUntilReset}m
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Usage</span>
            <span>{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`${colors.bar} h-3 rounded-full transition-all duration-300`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>

        {/* Warning Message */}
        {usagePercentage >= 70 && (
          <div className={`text-xs sm:text-sm ${colors.text} mt-2`}>
            {usagePercentage >= 90 ? (
              <p>
                <strong>Critical:</strong> You're approaching your rate limit. Consider reducing request frequency.
              </p>
            ) : (
              <p>
                <strong>Warning:</strong> You're using {usagePercentage.toFixed(0)}% of your rate limit.
              </p>
            )}
          </div>
        )}

        {/* Reset Time */}
        <div className="text-xs text-gray-600 pt-2 border-t border-gray-300">
          Rate limit resets at {resetDate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
