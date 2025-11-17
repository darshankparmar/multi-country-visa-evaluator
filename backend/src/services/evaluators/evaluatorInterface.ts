/**
 * Parameters for evaluation process
 */
export interface EvaluateParams {
  country: string;
  visaType: string;
  documents: Array<{
    filename: string;
    originalName: string;
    path: string;
  }>;
  userInfo: {
    name: string;
    email: string;
  };
}

/**
 * Result of evaluation process
 */
export interface EvaluationResult {
  score: number;
  summary: string;
}

/**
 * Interface for visa evaluation strategies
 * Implementations can use rule-based logic or AI-powered analysis
 */
export interface IEvaluator {
  /**
   * Evaluate a visa application and generate a score and summary
   * @param params - Evaluation parameters including user info, visa type, and documents
   * @returns Promise resolving to evaluation score (0-100) and summary text
   */
  evaluate(params: EvaluateParams): Promise<EvaluationResult>;
}
