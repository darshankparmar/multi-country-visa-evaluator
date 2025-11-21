import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import type { EvaluationDetail } from '../../api/types'

interface AnalyticsChartsProps {
  evaluations: EvaluationDetail[]
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ evaluations }) => {
  // Country breakdown data
  const countryData = useMemo(() => {
    const countMap = new Map<string, number>()
    evaluations.forEach(e => {
      const country = e.visaApplication.country
      countMap.set(country, (countMap.get(country) || 0) + 1)
    })
    return Array.from(countMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
  }, [evaluations])

  // Visa type breakdown data
  const visaTypeData = useMemo(() => {
    const typeMap = new Map<string, number>()
    evaluations.forEach(e => {
      const visaType = e.visaApplication.visaType
      typeMap.set(visaType, (typeMap.get(visaType) || 0) + 1)
    })
    return Array.from(typeMap.entries())
      .map(([visaType, count]) => ({ visaType, count }))
      .sort((a, b) => b.count - a.count)
  }, [evaluations])

  // Trend data (evaluations over time)
  const trendData = useMemo(() => {
    const dateMap = new Map<string, number>()
    evaluations.forEach(e => {
      const date = new Date(e.createdAt).toISOString().split('T')[0]
      dateMap.set(date, (dateMap.get(date) || 0) + 1)
    })
    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Last 30 days
  }, [evaluations])

  if (evaluations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">No data available for charts</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Country Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluations by Country</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={countryData} margin={{ bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="country" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Evaluations" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Visa Type Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluations by Visa Type</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={visaTypeData} margin={{ bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="visaType" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#10b981" name="Evaluations" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Evaluation Trend */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Trend (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Evaluations" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
