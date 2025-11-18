import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { StatCard } from '../components/dashboard/StatCard'
import { EvaluationFilters, type FilterState } from '../components/dashboard/EvaluationFilters'
import { AnalyticsCharts } from '../components/dashboard/AnalyticsCharts'
import { EvaluationTable } from '../components/dashboard/EvaluationTable'
import { ApiUsageMonitor } from '../components/dashboard/ApiUsageMonitor'
import { exportEvaluationsToCSV } from '../utils/csvExport'
import axios from 'axios'
import type { EvaluationDetail } from '../api/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

interface DashboardStats {
  total: number
  avgScore: number
  thisMonth: number
}

interface RateLimitInfo {
  limit: number
  remaining: number
  reset: string
}

interface ApiKeyLoginProps {
  onLogin: (apiKey: string) => void
}

const ApiKeyLogin: React.FC<ApiKeyLoginProps> = ({ onLogin }) => {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!apiKey.trim()) {
      setError('Please enter your API key')
      return
    }

    setIsLoading(true)

    try {
      // Validate API key by making a test request
      const response = await axios.get(`${API_BASE_URL}/evaluations`, {
        headers: { 'x-api-key': apiKey },
        params: { limit: 1 }
      })

      if (response.data) {
        // Store API key in session storage
        sessionStorage.setItem('partner-api-key', apiKey)
        onLogin(apiKey)
      }
    } catch (err: any) {
      console.error('API key validation error:', err)
      if (err.response?.status === 401) {
        setError('Invalid API key. Please check your credentials.')
      } else if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.')
      } else {
        setError('Failed to validate API key. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Dashboard</h1>
            <p className="text-gray-600">Enter your API key to access your evaluations</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {error && <ErrorMessage message={error} />}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Validating...</span>
                </span>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Don't have an API key?{' '}
              <a
                href="mailto:darshanparmar.dev@gmail.com"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const PartnerDashboardPage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    // Check session storage for existing API key
    return sessionStorage.getItem('partner-api-key') || ''
  })
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!sessionStorage.getItem('partner-api-key')
  })
  const [evaluations, setEvaluations] = useState<EvaluationDetail[]>([])
  const [stats, setStats] = useState<DashboardStats>({ total: 0, avgScore: 0, thisMonth: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)

  const handleLogin = (key: string) => {
    setApiKey(key)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('partner-api-key')
    setApiKey('')
    setIsAuthenticated(false)
  }

  // Fetch evaluations and calculate statistics
  useEffect(() => {
    if (!isAuthenticated || !apiKey) return

    const fetchEvaluations = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await axios.get(`${API_BASE_URL}/evaluations`, {
          headers: { 'x-api-key': apiKey }
        })

        // Extract rate limit headers
        const headers = response.headers
        if (headers['x-ratelimit-limit']) {
          setRateLimitInfo({
            limit: parseInt(headers['x-ratelimit-limit']),
            remaining: parseInt(headers['x-ratelimit-remaining'] || '0'),
            reset: headers['x-ratelimit-reset'] || new Date().toISOString()
          })
        }

        let evaluationData: EvaluationDetail[] = []
        
        // Handle different response formats
        if (response.data?.status === 'success' && response.data?.data) {
          evaluationData = response.data.data.evaluations || response.data.data
        } else if (Array.isArray(response.data)) {
          evaluationData = response.data
        } else if (response.data?.evaluations) {
          evaluationData = response.data.evaluations
        }

        setEvaluations(evaluationData)

        // Calculate statistics
        const total = evaluationData.length
        const avgScore = total > 0
          ? evaluationData.reduce((sum, e) => sum + (e.results?.score || 0), 0) / total
          : 0

        // Calculate this month's evaluations
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const thisMonth = evaluationData.filter(e => {
          const createdDate = new Date(e.createdAt)
          return createdDate >= thisMonthStart
        }).length

        setStats({
          total,
          avgScore: Math.round(avgScore * 10) / 10,
          thisMonth
        })
      } catch (err: any) {
        console.error('Failed to fetch evaluations:', err)
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.')
          handleLogout()
        } else {
          setError('Failed to load evaluations. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvaluations()
  }, [isAuthenticated, apiKey])

  // Filter evaluations based on filter state
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(evaluation => {
      // Date range filter
      if (filters.dateFrom) {
        const evalDate = new Date(evaluation.createdAt)
        const fromDate = new Date(filters.dateFrom)
        if (evalDate < fromDate) return false
      }
      if (filters.dateTo) {
        const evalDate = new Date(evaluation.createdAt)
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999) // Include the entire day
        if (evalDate > toDate) return false
      }

      // Country filter
      if (filters.country && evaluation.visaApplication.country !== filters.country) {
        return false
      }

      // Visa type filter
      if (filters.visaType && evaluation.visaApplication.visaType !== filters.visaType) {
        return false
      }

      // Score range filter
      const score = evaluation.results?.score || 0
      if (filters.minScore !== undefined && score < filters.minScore) {
        return false
      }
      if (filters.maxScore !== undefined && score > filters.maxScore) {
        return false
      }

      // Search filter (name or email)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const nameMatch = evaluation.userInfo.name.toLowerCase().includes(searchLower)
        const emailMatch = evaluation.userInfo.email.toLowerCase().includes(searchLower)
        if (!nameMatch && !emailMatch) return false
      }

      return true
    })
  }, [evaluations, filters])

  // Get unique countries and visa types for filter dropdowns
  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(evaluations.map(e => e.visaApplication.country))).sort()
  }, [evaluations])

  const uniqueVisaTypes = useMemo(() => {
    return Array.from(new Set(evaluations.map(e => e.visaApplication.visaType))).sort()
  }, [evaluations])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleExport = () => {
    exportEvaluationsToCSV(filteredEvaluations)
  }

  if (!isAuthenticated) {
    return <ApiKeyLogin onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Partner Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and analyze your visa evaluations</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full sm:w-auto flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </div>

        {/* API Guide Link */}
        <div className="mb-8">
          <a
            href="/partner-api-guide"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            View Partner API Guide & Documentation
          </a>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading dashboard..." />
          </div>
        ) : (
          <>
            {/* API Usage Monitor */}
            <ApiUsageMonitor rateLimitInfo={rateLimitInfo} />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <StatCard
                title="Total Evaluations"
                value={stats.total}
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              <StatCard
                title="Average Score"
                value={stats.avgScore}
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
              <StatCard
                title="This Month"
                value={stats.thisMonth}
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>

            {/* Filters */}
            <EvaluationFilters
              onFilterChange={handleFilterChange}
              countries={uniqueCountries}
              visaTypes={uniqueVisaTypes}
            />

            {/* Filtered Results Info */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing {filteredEvaluations.length} of {evaluations.length} evaluations
              </p>
            </div>

            {/* Analytics Charts */}
            <div className="mb-8">
              <AnalyticsCharts evaluations={filteredEvaluations} />
            </div>

            {/* Evaluation Table */}
            <EvaluationTable
              evaluations={filteredEvaluations}
              onExport={handleExport}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default PartnerDashboardPage
