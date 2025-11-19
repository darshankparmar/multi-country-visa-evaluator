export interface EvaluationRequest {
  name: string
  email: string
  country: string
  visaType: string
  documents: File[]
}

/**
 * Rating type for criterion analysis
 */
export type CriterionRating = 'STRONG' | 'GOOD' | 'MODERATE' | 'WEAK' | 'CRITICAL_GAP'

/**
 * Interface for criterion analysis in structured evaluation
 */
export interface CriterionAnalysis {
  name: string
  rating: CriterionRating
  evidence: string[]
  gaps: string[]
  recommendation?: string
  isCritical: boolean
}

/**
 * Priority type for recommendations
 */
export type RecommendationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

/**
 * Interface for prioritized recommendation
 */
export interface PrioritizedRecommendation {
  priority: RecommendationPriority
  text: string
  relatedCriterion?: string
}

/**
 * Approval likelihood type
 */
export type ApprovalLikelihood = 'Strong' | 'Good' | 'Moderate' | 'Needs Improvement' | 'Low' | 'Not Viable'

/**
 * Interface for score breakdown display
 */
export interface ScoreBreakdown {
  baseScore: number
  penalties: Array<{
    requirement: string
    points: number
    reason: string
  }>
  totalPenalty: number
  adjustedScore: number
  breakdown: Array<{
    criterion: string
    points: number
    maxPoints: number
    percentage: number
  }>
}

export interface EvaluationResponse {
  evaluationId: string
  score: number
  summary: string
  recommendations?: string[]
  conclusion?: string
  userInfo: {
    name: string
    email: string
  }
  visaApplication: {
    country: string
    visaType: string
  }
  createdAt: string
  criteriaAnalysis?: CriterionAnalysis[]
  prioritizedRecommendations?: PrioritizedRecommendation[]
  scoreBreakdown?: ScoreBreakdown
  approvalLikelihood?: ApprovalLikelihood
}

/**
 * Interface for parsed document information
 */
export interface ParsedDocument {
  filename: string
  originalName: string
  extractedText?: string
  documentType: string
  success: boolean
  error?: string
}

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
    extractedText?: string
  }>
  parsedDocuments?: ParsedDocument[]
  results: {
    score: number
    summary: string
    recommendations?: string[]
    conclusion?: string
    evaluatedAt: string
    criteriaAnalysis?: CriterionAnalysis[]
    prioritizedRecommendations?: PrioritizedRecommendation[]
    scoreBreakdown?: ScoreBreakdown
    approvalLikelihood?: ApprovalLikelihood
    validationResults?: Array<{
      criterion: string
      met: boolean
      score: number
      maxScore: number
      details: string
      isCritical: boolean
      evidence?: string[]
      sourceDocument?: string
    }>
  }
  createdAt: string
  updatedAt: string
}

export interface VisaType {
  _id: string
  country: string
  visaType: string
  requiredDocuments: string[]
  description?: string
  processingTime?: string
  active: boolean
}

export interface Country {
  name: string
}
