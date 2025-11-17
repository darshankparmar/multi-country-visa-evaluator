import { apiClient } from './client'
import type { EvaluationRequest, EvaluationResponse, EvaluationDetail } from './types'

/**
 * API service for visa evaluation operations
 * 
 * Provides methods to submit new evaluations and retrieve existing ones
 */
export const evaluationApi = {
  /**
   * Submit a new visa evaluation with documents
   * 
   * Converts the evaluation data to FormData format for multipart upload
   * and sends it to the backend for processing.
   * 
   * @param {EvaluationRequest} data - Evaluation data including personal info, visa selection, and documents
   * @returns {Promise<EvaluationResponse>} Evaluation result with ID, score, and summary
   * 
   * @example
   * ```typescript
   * const result = await evaluationApi.submitEvaluation({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   country: 'United States',
   *   visaType: 'H-1B Work Visa',
   *   documents: [file1, file2]
   * })
   * console.log(result.evaluationId, result.score)
   * ```
   * 
   * @throws {Error} If submission fails or validation errors occur
   */
  async submitEvaluation(data: EvaluationRequest): Promise<EvaluationResponse> {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('email', data.email)
    formData.append('country', data.country)
    formData.append('visaType', data.visaType)
    
    data.documents.forEach((file) => {
      formData.append('documents', file)
    })

    return apiClient.post('/evaluations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * Retrieve an existing evaluation by its ID
   * 
   * Fetches complete evaluation details including user info, visa application,
   * documents, and results.
   * 
   * @param {string} id - UUID of the evaluation to retrieve
   * @returns {Promise<EvaluationDetail>} Complete evaluation details
   * 
   * @example
   * ```typescript
   * const evaluation = await evaluationApi.getEvaluationById(
   *   '123e4567-e89b-12d3-a456-426614174000'
   * )
   * console.log(evaluation.results.score, evaluation.results.summary)
   * ```
   * 
   * @throws {Error} If evaluation not found or retrieval fails
   */
  async getEvaluationById(id: string): Promise<EvaluationDetail> {
    return apiClient.get(`/evaluations/${id}`)
  }
}
