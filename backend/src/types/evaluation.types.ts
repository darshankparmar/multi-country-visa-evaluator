import { Document, Types } from 'mongoose';

/**
 * Interface for document upload information
 */
export interface IDocumentUpload {
  filename: string;
  originalName: string;
  path: string;
  uploadedAt: Date;
  extractedText?: string;
}

/**
 * Interface for validation result
 */
export interface ValidationResult {
  criterion: string;
  met: boolean;
  score: number;
  maxScore: number;
  details: string;
  isCritical: boolean;
}

/**
 * Interface for evaluation results
 */
export interface IEvaluationResults {
  score: number;
  summary: string;
  evaluatedAt: Date;
  recommendations?: string[];
  conclusion?: string;
  criteriaAnalysis?: CriterionAnalysis[];
  prioritizedRecommendations?: PrioritizedRecommendation[];
  scoreBreakdown?: {
    baseScore: number;
    penalties: Array<{
      requirement: string;
      points: number;
      reason: string;
    }>;
    totalPenalty: number;
    adjustedScore: number;
    breakdown: Array<{
      criterion: string;
      points: number;
      maxPoints: number;
      percentage: number;
    }>;
  };
  approvalLikelihood?: ApprovalLikelihood;
  validationResults?: ValidationResult[];
}

/**
 * Interface for Evaluation document in MongoDB
 */
export interface IEvaluation extends Document {
  _id: Types.ObjectId;
  evaluationId: string;
  userInfo: {
    name: string;
    email: string;
  };
  visaApplication: {
    country: string;
    visaType: string;
  };
  documents: IDocumentUpload[];
  results?: IEvaluationResults;
  partnerId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating a new evaluation
 */
export interface CreateEvaluationRequest {
  name: string;
  email: string;
  country: string;
  visaType: string;
  documents?: Express.Multer.File[];
}

/**
 * DTO for evaluation response
 */
export interface EvaluationResponse {
  evaluationId: string;
  userInfo: {
    name: string;
    email: string;
  };
  visaApplication: {
    country: string;
    visaType: string;
  };
  documents: Array<{
    filename: string;
    originalName: string;
    uploadedAt: Date;
  }>;
  results?: {
    score: number;
    summary: string;
    evaluatedAt: Date;
    recommendations?: string[];
    conclusion?: string;
    criteriaAnalysis?: CriterionAnalysis[];
    prioritizedRecommendations?: PrioritizedRecommendation[];
    scoreBreakdown?: {
      baseScore: number;
      penalties: Array<{
        requirement: string;
        points: number;
        reason: string;
      }>;
      totalPenalty: number;
      adjustedScore: number;
      breakdown: Array<{
        criterion: string;
        points: number;
        maxPoints: number;
        percentage: number;
      }>;
    };
    approvalLikelihood?: ApprovalLikelihood;
    validationResults?: ValidationResult[];
  };
  partnerId?: string;
  createdAt: Date;
}

/**
 * DTO for evaluation list response with pagination
 */
export interface EvaluationListResponse {
  evaluations: EvaluationResponse[];
  total: number;
  page: number;
  limit: number;
}

/**
 * DTO for updating evaluation results
 */
export interface UpdateEvaluationResultsRequest {
  score: number;
  summary: string;
}

/**
 * Query parameters for listing evaluations
 */
export interface ListEvaluationsQuery {
  page?: number;
  limit?: number;
  partnerId?: string;
  startDate?: string;
  endDate?: string;
  country?: string;
  email?: string;
}

/**
 * Rating type for criterion analysis
 */
export type CriterionRating = 'STRONG' | 'GOOD' | 'MODERATE' | 'WEAK' | 'CRITICAL_GAP';

/**
 * Interface for criterion analysis in structured evaluation
 */
export interface CriterionAnalysis {
  name: string;
  rating: CriterionRating;
  evidence: string[];
  gaps: string[];
  recommendation?: string;
  isCritical: boolean;
}

/**
 * Priority type for recommendations
 */
export type RecommendationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Interface for prioritized recommendation
 */
export interface PrioritizedRecommendation {
  priority: RecommendationPriority;
  text: string;
  relatedCriterion?: string;
}

/**
 * Approval likelihood type
 */
export type ApprovalLikelihood = 'Strong' | 'Good' | 'Moderate' | 'Needs Improvement' | 'Low' | 'Not Viable';

/**
 * Interface for structured evaluation result
 */
export interface StructuredEvaluationResult {
  score: number;
  criteriaAnalysis: CriterionAnalysis[];
  prioritizedRecommendations: PrioritizedRecommendation[];
  summary: string;
  conclusion: string;
  scoreBreakdown: {
    baseScore: number;
    penalties: Array<{
      requirement: string;
      points: number;
      reason: string;
    }>;
    totalPenalty: number;
    adjustedScore: number;
    breakdown: Array<{
      criterion: string;
      points: number;
      maxPoints: number;
      percentage: number;
    }>;
  };
  approvalLikelihood: ApprovalLikelihood;
}
