/**
 * Evaluation-related TypeScript interfaces and types
 */

/**
 * Request payload for submitting a new evaluation
 */
export interface EvaluationRequest {
  name: string
  email: string
  country: string
  visaType: string
  documents: File[]
}

/**
 * Response from evaluation submission
 */
export interface EvaluationResponse {
  status: 'success'
  data: {
    evaluationId: string
    score: number
    summary: string
    userInfo: {
      name: string
      email: string
    }
    visaApplication: {
      country: string
      visaType: string
    }
    createdAt: string
  }
}

/**
 * Detailed evaluation information
 */
export interface EvaluationDetail {
  evaluationId: string
  userInfo: {
    name: string
    email: string
  }
  visaApplication: {
    country: string
    visaType: string
  }
  documents: Array<{
    filename: string
    originalName: string
    uploadedAt: string
  }>
  results: {
    score: number
    summary: string
    evaluatedAt: string
  }
  createdAt: string
  updatedAt: string
}

/**
 * Evaluation status constants
 */
export const EvaluationStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const

export type EvaluationStatusType = typeof EvaluationStatus[keyof typeof EvaluationStatus]
