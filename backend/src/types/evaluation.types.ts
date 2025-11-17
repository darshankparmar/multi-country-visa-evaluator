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
 * Interface for evaluation results
 */
export interface IEvaluationResults {
  score: number;
  summary: string;
  evaluatedAt: Date;
  recommendations?: string[];
  conclusion?: string;
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
