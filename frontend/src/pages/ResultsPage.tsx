import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { evaluationApi } from '../api/evaluations'
import { ResultsDisplay } from '../components/results/ResultsDisplay'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorMessage } from '../components/common/ErrorMessage'
import type { EvaluationDetail } from '../api/types'

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(
    location.state?.evaluation || null
  )
  const [loading, setLoading] = useState(!location.state?.evaluation)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!evaluation && id) {
      const fetchEvaluation = async () => {
        try {
          const data = await evaluationApi.getEvaluationById(id)
          setEvaluation(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load evaluation')
        } finally {
          setLoading(false)
        }
      }
      fetchEvaluation()
    }
  }, [id, evaluation])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message={error} onRetry={() => navigate('/search')} />
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message="Evaluation not found" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ResultsDisplay evaluation={evaluation} />
      </div>
    </div>
  )
}
