import { apiClient } from './client'
import type { EvaluationRequest, EvaluationResponse, EvaluationDetail } from './types'

export const evaluationApi = {
  /**
   * Submit new evaluation with documents
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
   * Get evaluation by ID
   */
  async getEvaluationById(id: string): Promise<EvaluationDetail> {
    return apiClient.get(`/evaluations/${id}`)
  }
}
