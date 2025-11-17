import { useState, useCallback } from 'react'
import { evaluationApi } from '../api/evaluations'
import type { EvaluationRequest, EvaluationResponse, EvaluationDetail } from '../api/types'

/**
 * Custom hook for handling evaluation submission and retrieval
 * @returns Object containing submission and retrieval functions with loading/error states
 */
export const useEvaluation = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Submit a new evaluation
   * @param data - Evaluation request data
   * @returns Promise with evaluation response
   */
  const submitEvaluation = useCallback(async (data: EvaluationRequest): Promise<EvaluationResponse> => {
    setLoading(true)
    setError(null)

    try {
      const response = await evaluationApi.submitEvaluation(data)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit evaluation'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get evaluation by ID
   * @param id - Evaluation ID
   * @returns Promise with evaluation details
   */
  const getEvaluationById = useCallback(async (id: string): Promise<EvaluationDetail> => {
    setLoading(true)
    setError(null)

    try {
      const evaluation = await evaluationApi.getEvaluationById(id)
      return evaluation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch evaluation'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    submitEvaluation,
    getEvaluationById,
    loading,
    error
  }
}
