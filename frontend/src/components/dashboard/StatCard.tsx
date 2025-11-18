import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          <span
            className={`text-xs sm:text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '+' : '-'}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  )
}
