import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { evaluationApi } from '../api/evaluations'
import { ResultsDisplay } from '../components/results/ResultsDisplay'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorMessage } from '../components/common/ErrorMessage'
import type { EvaluationDetail, EvaluationResponse } from '../api/types'

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      // Check if evaluation data was passed through navigation state
      const passedData = location.state?.evaluationData as EvaluationResponse | undefined
      
      if (passedData) {
        // Use the passed data to avoid extra API call
        const evaluationDetail: EvaluationDetail = {
          evaluationId: passedData.evaluationId,
          userInfo: passedData.userInfo,
          visaApplication: passedData.visaApplication,
          documents: [], // Documents not included in submit response
          results: {
            score: passedData.score,
            summary: passedData.summary,
            recommendations: passedData.recommendations,
            conclusion: passedData.conclusion,
            evaluatedAt: passedData.createdAt,
            criteriaAnalysis: passedData.criteriaAnalysis,
            prioritizedRecommendations: passedData.prioritizedRecommendations,
            scoreBreakdown: passedData.scoreBreakdown,
            approvalLikelihood: passedData.approvalLikelihood,
            validationResults: passedData.validationResults
          },
          createdAt: passedData.createdAt,
          updatedAt: passedData.createdAt
        }
        setEvaluation(evaluationDetail)
        setLoading(false)
      } else {
        // Fetch from API if no data was passed (e.g., direct URL access or page refresh)
        const fetchEvaluation = async () => {
          setLoading(true)
          setError(null)
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
    } else {
      setLoading(false)
      setError('No evaluation ID provided')
    }
  }, [id, location.state])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <ErrorMessage message={error} onRetry={() => navigate('/search')} />
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <ErrorMessage message="Evaluation not found" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <ResultsDisplay evaluation={evaluation} />
    </div>
  )
}

export default ResultsPage
