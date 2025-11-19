import OpenAI from 'openai';
import { IEvaluator, EvaluateParams, EvaluationResult } from './evaluatorInterface';
import { getConfig } from '../../config/environment';
import { logger } from '../../config/logger';
import { DocumentParser, ParsedDocument } from '../documentParser';
import { getScoringConfig, VisaScoringConfig, InternalCategoryScore } from '../../config/scoringCategories';
import { getMockResponse } from './mockAIResponses';
import { sanitizeForLogging } from '../../utils/piiSanitizer';
import { getVisaCriteria, VisaCriteriaConfig } from '../../config/visaCriteria';
import { CriteriaValidator, ApplicantData, ValidationResult } from '../criteriaValidator';
import { EnhancedPromptBuilder } from '../enhancedPromptBuilder';
import { ScoringEngine, ScoreCalculation } from '../scoringEngine';
import { 
  StructuredEvaluationResult, 
  CriterionAnalysis, 
  PrioritizedRecommendation,
  ApprovalLikelihood,
  CriterionRating,
  RecommendationPriority
} from '../../types/evaluation.types';

/**
 * AI-based evaluator implementation using OpenAI API
 * Analyzes visa applications using GPT models for intelligent scoring
 * Supports mock mode for cost-free testing and development
 */
export class AIEvaluator implements IEvaluator {
  private openai: OpenAI | null;
  private model: string;
  private documentParser: DocumentParser;
  private mockMode: boolean;

  constructor() {
    const config = getConfig();
    
    // Check if mock mode is enabled
    this.mockMode = config.USE_MOCK_AI;
    
    if (this.mockMode) {
      logger.info('AI Evaluator initialized in MOCK mode - no OpenAI API calls will be made');
      this.openai = null;
    } else {
      if (!config.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for AI evaluator');
      }

      this.openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY
      });
      
      logger.info('AI Evaluator initialized with OpenAI API');
    }
    
    this.model = config.AI_MODEL || 'gpt-4';
    this.documentParser = new DocumentParser();
  }

  /**
   * Evaluate visa application using AI analysis with document parsing
   * Uses mock responses when mockMode is enabled
   * Routes to visa-specific evaluation if criteria exists
   */
  async evaluate(params: EvaluateParams): Promise<EvaluationResult> {
    const { country, visaType, documents, userInfo } = params;
    const evaluationStartTime = Date.now();

    try {
      // Check for visa-specific criteria
      const visaCriteria = getVisaCriteria(country, visaType);
      
      if (visaCriteria) {
        // Use visa-specific evaluation
        logger.info('Visa-specific criteria found, using enhanced evaluation', {
          country,
          visaType,
          documentCount: documents.length,
          applicantName: userInfo.name,
          mockMode: this.mockMode,
          criteriaConfiguration: {
            visaType: visaCriteria.visaType,
            description: visaCriteria.description,
            hasSalaryThresholds: !!visaCriteria.salaryThresholds && visaCriteria.salaryThresholds.length > 0,
            salaryThresholdCount: visaCriteria.salaryThresholds?.length || 0,
            educationLevel: visaCriteria.educationLevel,
            experienceYears: visaCriteria.experienceYears,
            laborMarketTestRequired: visaCriteria.laborMarketTestRequired,
            sponsorRequired: visaCriteria.sponsorRequired,
            hasUniqueRules: !!visaCriteria.uniqueRules && visaCriteria.uniqueRules.length > 0,
            criteriaWeights: visaCriteria.criteriaWeights
          }
        });
        
        return await this.evaluateWithVisaCriteria(params, visaCriteria);
      } else {
        // Fall back to existing generic evaluation
        logger.info('No visa-specific criteria found, falling back to generic evaluation', {
          country,
          visaType,
          documentCount: documents.length,
          applicantName: userInfo.name,
          mockMode: this.mockMode,
          fallbackReason: 'No matching visa criteria configuration found',
          fallbackType: 'generic_evaluation'
        });
        
        return await this.evaluateGeneric(params);
      }
    } catch (error) {
      const errorDuration = Date.now() - evaluationStartTime;
      
      logger.error('AI evaluation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        country,
        visaType,
        durationMs: errorDuration,
        documentCount: documents.length
      });

      // Fallback to basic evaluation on error
      const fallbackResult = this.fallbackEvaluation(params);
      
      // Log fallback evaluation completion
      this.logEvaluationCompletion({
        country,
        visaType,
        result: fallbackResult,
        durationMs: Date.now() - evaluationStartTime,
        mockMode: false,
        documentCount: documents.length,
        usedFallback: true
      });
      
      return fallbackResult;
    }
  }

  /**
   * Generic evaluation (existing implementation)
   * Used when no visa-specific criteria exists
   */
  private async evaluateGeneric(params: EvaluateParams): Promise<EvaluationResult> {
    const { country, visaType, documents, userInfo } = params;
    const evaluationStartTime = Date.now();

    // Get scoring configuration
    const scoringConfig = getScoringConfig(country, visaType);
    
    logger.info('Starting generic AI evaluation', {
      country,
      visaType,
      documentCount: documents.length,
      applicantName: userInfo.name,
      mockMode: this.mockMode,
      scoringCategories: scoringConfig.categories.length
    });
    
    // If mock mode is enabled, return mock response
    if (this.mockMode) {
      const result = this.getMockEvaluation(country, visaType, scoringConfig);
      
      // Log completion metrics for mock evaluation
      this.logEvaluationCompletion({
        country,
        visaType,
        result,
        durationMs: Date.now() - evaluationStartTime,
        mockMode: true,
        documentCount: documents.length
      });
      
      return result;
    }

    // Parse document content
    const parseStartTime = Date.now();
    const parsedDocuments = await this.documentParser.parseDocuments(documents);
    const parseDuration = Date.now() - parseStartTime;
    
    logger.info('Document parsing phase completed', {
      durationMs: parseDuration,
      successfulParses: parsedDocuments.filter(d => d.success).length,
      failedParses: parsedDocuments.filter(d => !d.success).length
    });
    
    // Create enhanced prompt with actual content
    const prompt = this.createEnhancedPrompt(
      country,
      visaType,
      parsedDocuments,
      scoringConfig,
      userInfo
    );

    // Call OpenAI API with retry logic
    const apiStartTime = Date.now();
    logger.info('Calling OpenAI API for generic visa evaluation', {
      country,
      visaType,
      model: this.model,
      documentCount: documents.length,
      parsedDocuments: parsedDocuments.filter(d => d.success).length,
      promptLength: prompt.length
    });

    const response = await this.callOpenAIWithRetry([
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      {
        role: 'user',
        content: prompt
      }
    ]);
    
    const apiDuration = Date.now() - apiStartTime;

    // Log OpenAI API usage and cost
    this.logOpenAIUsage(response, apiDuration);

    // Parse structured response
    const result = this.parseEnhancedResponse(response, scoringConfig);

    // Log evaluation completion metrics
    this.logEvaluationCompletion({
      country,
      visaType,
      result,
      durationMs: Date.now() - evaluationStartTime,
      mockMode: false,
      documentCount: documents.length,
      parseDurationMs: parseDuration,
      apiDurationMs: apiDuration
    });

    return result;
  }

  /**
   * Evaluate with visa-specific criteria (returns structured result)
   * Uses CriteriaValidator, ScoringEngine, and EnhancedPromptBuilder for targeted evaluation
   * Returns StructuredEvaluationResult with detailed criterion-by-criterion analysis
   */
  private async evaluateWithVisaCriteriaStructured(
    params: EvaluateParams,
    visaCriteria: VisaCriteriaConfig
  ): Promise<StructuredEvaluationResult> {
    const { country, visaType, documents, userInfo } = params;
    const evaluationStartTime = Date.now();

    logger.info('Starting visa-specific AI evaluation (structured)', {
      country,
      visaType,
      documentCount: documents.length,
      applicantName: userInfo.name,
      mockMode: this.mockMode,
      criteriaUsed: visaCriteria.visaType
    });

    // If mock mode is enabled, return mock response
    if (this.mockMode) {
      const scoringConfig = getScoringConfig(country, visaType);
      const legacyResult = this.getMockEvaluation(country, visaType, scoringConfig);
      
      // Convert mock result to structured format
      const mockStructured: StructuredEvaluationResult = {
        score: legacyResult.score,
        summary: legacyResult.summary,
        conclusion: legacyResult.conclusion || 'Mock evaluation completed',
        criteriaAnalysis: [],
        prioritizedRecommendations: (legacyResult.recommendations || []).map((text, index) => ({
          priority: index === 0 ? 'HIGH' : 'MEDIUM' as RecommendationPriority,
          text,
          relatedCriterion: undefined
        })),
        scoreBreakdown: {
          baseScore: legacyResult.score,
          penalties: [],
          totalPenalty: 0,
          adjustedScore: legacyResult.score,
          breakdown: []
        },
        approvalLikelihood: legacyResult.score >= 70 ? 'Good' : 'Moderate'
      };
      
      logger.info('Mock evaluation completed with visa-specific context', {
        country,
        visaType,
        score: mockStructured.score,
        criteriaUsed: visaCriteria.visaType
      });
      
      return mockStructured;
    }

    // Parse documents using existing documentParser
    const parseStartTime = Date.now();
    const parsedDocuments = await this.documentParser.parseDocuments(documents);
    const parseDuration = Date.now() - parseStartTime;
    
    logger.info('Document parsing phase completed', {
      durationMs: parseDuration,
      successfulParses: parsedDocuments.filter(d => d.success).length,
      failedParses: parsedDocuments.filter(d => !d.success).length
    });

    // Extract applicant data from parsed documents
    const applicantData = this.extractApplicantData(parsedDocuments, userInfo);
    
    logger.debug('Applicant data extracted', {
      hasSalary: !!applicantData.salary,
      hasEducation: !!applicantData.education,
      hasExperience: applicantData.experienceYears !== undefined
    });

    // Validate criteria using CriteriaValidator
    const validator = new CriteriaValidator();
    const validationResults = validator.validateAllCriteria(applicantData, visaCriteria);
    
    // Log detailed validation results for each criterion
    logger.info('Criteria validation completed', {
      country,
      visaType,
      criteriaUsed: visaCriteria.visaType,
      totalCriteria: validationResults.length,
      criteriaMet: validationResults.filter(r => r.met).length,
      criteriaFailed: validationResults.filter(r => !r.met).length,
      validationDetails: validationResults.map(r => ({
        criterion: r.criterion,
        met: r.met,
        score: r.score,
        maxScore: r.maxScore,
        percentage: ((r.score / r.maxScore) * 100).toFixed(1) + '%',
        details: r.details,
        hasRecommendation: !!r.recommendation
      }))
    });

    // Calculate score from validation results using ScoringEngine
    const scoringEngine = new ScoringEngine();
    const scoreCalculation = scoringEngine.calculateScore(validationResults, visaCriteria);
    
    logger.info('Score calculation completed', {
      country,
      visaType,
      baseScore: scoreCalculation.baseScore,
      totalPenalty: scoreCalculation.totalPenalty,
      adjustedScore: scoreCalculation.adjustedScore,
      penaltiesApplied: scoreCalculation.penalties.length
    });

    // Build visa-specific prompt using EnhancedPromptBuilder with validation results
    const promptBuilder = new EnhancedPromptBuilder();
    const prompt = promptBuilder.buildVisaSpecificPromptWithValidation(
      country,
      visaType,
      visaCriteria,
      parsedDocuments,
      userInfo,
      validationResults,
      scoreCalculation
    );

    // Call OpenAI with enhanced prompt
    const apiStartTime = Date.now();
    logger.info('Calling OpenAI API with visa-specific prompt', {
      country,
      visaType,
      model: this.model,
      promptLength: prompt.length,
      criteriaUsed: visaCriteria.visaType
    });

    const response = await this.callOpenAIWithRetry([
      {
        role: 'system',
        content: this.getVisaSpecificSystemPrompt(visaCriteria)
      },
      {
        role: 'user',
        content: prompt
      }
    ]);
    
    const apiDuration = Date.now() - apiStartTime;

    // Log OpenAI API usage and cost
    this.logOpenAIUsage(response, apiDuration);

    // Parse response with structured logic
    const structuredResult = this.parseStructuredResponse(
      response,
      scoreCalculation,
      validationResults,
      visaCriteria
    );

    logger.info('Visa-specific evaluation completed (structured)', {
      country,
      visaType,
      score: structuredResult.score,
      criteriaUsed: visaCriteria.visaType,
      evaluationType: 'visa_specific_ai_structured',
      criteriaConfiguration: {
        salaryThresholds: visaCriteria.salaryThresholds?.length || 0,
        educationLevel: visaCriteria.educationLevel,
        experienceYears: visaCriteria.experienceYears,
        laborMarketTestRequired: visaCriteria.laborMarketTestRequired,
        sponsorRequired: visaCriteria.sponsorRequired
      },
      validationResults: validationResults.map(r => ({
        criterion: r.criterion,
        met: r.met,
        score: r.score,
        maxScore: r.maxScore,
        percentage: ((r.score / r.maxScore) * 100).toFixed(1) + '%'
      })),
      structuredOutput: {
        criteriaAnalysisCount: structuredResult.criteriaAnalysis.length,
        prioritizedRecommendationsCount: structuredResult.prioritizedRecommendations.length,
        approvalLikelihood: structuredResult.approvalLikelihood,
        hasScoreBreakdown: !!structuredResult.scoreBreakdown
      },
      performance: {
        totalDurationMs: Date.now() - evaluationStartTime,
        parseDurationMs: parseDuration,
        apiDurationMs: apiDuration
      }
    });

    return structuredResult;
  }

  /**
   * Evaluate with visa-specific criteria (legacy method for backward compatibility)
   * Uses CriteriaValidator and EnhancedPromptBuilder for targeted evaluation
   * Calls the structured method and converts to legacy format
   */
  private async evaluateWithVisaCriteria(
    params: EvaluateParams,
    visaCriteria: VisaCriteriaConfig
  ): Promise<EvaluationResult> {
    // Call the structured method
    const structuredResult = await this.evaluateWithVisaCriteriaStructured(params, visaCriteria);

    // Convert to legacy EvaluationResult format
    // Attach structured result as property for service layer to access
    const result: EvaluationResult & { structuredResult?: StructuredEvaluationResult } = {
      score: structuredResult.score,
      summary: structuredResult.summary,
      recommendations: structuredResult.prioritizedRecommendations.map(r => r.text),
      conclusion: structuredResult.conclusion,
      structuredResult // Attach the full structured result
    };

    return result;
  }

  /**
   * Generate mock evaluation response for testing
   * Returns predefined evaluation without calling OpenAI API
   */
  private getMockEvaluation(
    country: string,
    visaType: string,
    scoringConfig: VisaScoringConfig
  ): EvaluationResult {
    // Get mock response data
    const mockData = getMockResponse(country, visaType);
    
    // Build category scores using the same logic as real evaluations
    const categoryScores = this.buildCategoryScores(mockData.categoryScores, scoringConfig);
    const finalScore = this.calculateWeightedScore(categoryScores);
    
    // Log category breakdown for internal audit (same as real evaluations)
    logger.info('Mock evaluation - Category scores calculated (internal audit only)', {
      categoryBreakdown: categoryScores.map(c => ({ 
        category: c.category, 
        score: c.score,
        weight: c.weight,
        weightedScore: c.weightedScore,
        reasoning: sanitizeForLogging(c.reasoning, 100)
      })),
      scoring: {
        finalScore: Math.round(finalScore),
        rawScore: finalScore,
        totalWeight: categoryScores.reduce((sum, c) => sum + c.weight, 0),
        averageCategoryScore: Math.round(
          categoryScores.reduce((sum, c) => sum + c.score, 0) / categoryScores.length
        )
      },
      mockMode: true,
      note: 'Category scores are for internal audit only and not exposed to users'
    });
    
    // Return only user-facing fields (same structure as real evaluations)
    return {
      score: Math.round(finalScore),
      summary: mockData.summary,
      recommendations: mockData.recommendations,
      conclusion: mockData.conclusion
    };
  }

  /**
   * Get enhanced system prompt for OpenAI
   * Defines AI role and analysis requirements
   */
  private getSystemPrompt(): string {
    return `You are an expert immigration consultant with deep knowledge of visa requirements across multiple countries. 
Your role is to:
1. Analyze actual document content (not just filenames)
2. Evaluate applications across multiple weighted categories
3. Provide specific, actionable recommendations
4. Give a clear conclusion about application viability

Be objective, professional, and thorough in your analysis.`;
  }

  /**
   * Get visa-specific system prompt for OpenAI
   * Creates specialized prompt with visa type requirements
   */
  private getVisaSpecificSystemPrompt(criteria: VisaCriteriaConfig): string {
    return `You are an expert immigration consultant specializing in ${criteria.country} ${criteria.visaType} applications.

Your role is to:
1. Analyze the applicant's documents against SPECIFIC legal requirements for this visa type
2. Verify if mandatory criteria are met (salary thresholds, education, experience, etc.)
3. Provide detailed, actionable recommendations based on actual visa requirements
4. Give a realistic assessment of approval likelihood

Key requirements for ${criteria.visaType}:
${this.formatCriteriaForSystemPrompt(criteria)}

Be objective, cite specific requirements, and provide practical guidance based on the legal framework for this visa type.`;
  }

  /**
   * Format criteria for system prompt
   * Creates concise summary of visa requirements for AI context
   */
  private formatCriteriaForSystemPrompt(criteria: VisaCriteriaConfig): string {
    const parts: string[] = [];
    
    // Format salary thresholds with conditions
    if (criteria.salaryThresholds && criteria.salaryThresholds.length > 0) {
      const salaryParts = criteria.salaryThresholds.map(t => 
        `${t.currency} ${t.amount.toLocaleString()} ${t.period}${t.conditions ? ` (${t.conditions})` : ''}`
      );
      
      if (salaryParts.length === 1) {
        parts.push(`- Salary: ${salaryParts[0]}`);
      } else {
        parts.push(`- Salary: ${salaryParts.join(' OR ')}`);
      }
    }
    
    // Format education and alternative qualifications
    if (criteria.educationLevel && criteria.educationLevel !== 'None') {
      let eduPart = `- Education: ${criteria.educationLevel} degree required`;
      if (criteria.alternativeQualification) {
        eduPart += ` (or ${criteria.alternativeQualification})`;
      }
      parts.push(eduPart);
    } else if (criteria.educationLevel === 'None' && criteria.alternativeQualification) {
      parts.push(`- Qualification: ${criteria.alternativeQualification}`);
    }
    
    // Format experience requirements
    if (criteria.experienceYears !== undefined && criteria.experienceYears > 0) {
      parts.push(`- Experience: Minimum ${criteria.experienceYears} year${criteria.experienceYears !== 1 ? 's' : ''}`);
    }
    
    // Include labor market test status
    if (criteria.laborMarketTestRequired) {
      parts.push(`- Labor Market Test: REQUIRED - employer must prove no suitable local workers available`);
    } else {
      parts.push(`- Labor Market Test: NOT required (advantage)`);
    }
    
    // Include sponsor requirements
    if (criteria.sponsorRequired) {
      parts.push(`- Sponsor: ${criteria.sponsorType || 'Employer sponsorship'} required`);
    } else {
      parts.push(`- Sponsor: NOT required`);
    }
    
    // List unique rules and benefits
    if (criteria.uniqueRules && criteria.uniqueRules.length > 0) {
      parts.push(`- Special rules: ${criteria.uniqueRules.join('; ')}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Format parsed document content for prompt
   * Handles parsing failures and truncates long text
   */
  private formatDocumentContent(parsedDocuments: ParsedDocument[]): string {
    if (parsedDocuments.length === 0) {
      return 'No documents provided';
    }

    return parsedDocuments.map((doc, index) => {
      if (!doc.success) {
        return `${index + 1}. ${doc.originalName} (${doc.documentType}) - [Parsing failed: ${doc.error}]`;
      }
      
      // Truncate very long text
      const text = doc.extractedText.length > 1000 
        ? doc.extractedText.substring(0, 1000) + '... [truncated]'
        : doc.extractedText;

      return `${index + 1}. ${doc.originalName} (${doc.documentType}):
${text}
---`;
    }).join('\n\n');
  }

  /**
   * Create enhanced evaluation prompt with document content
   * Includes scoring categories and structured response format
   */
  private createEnhancedPrompt(
    country: string,
    visaType: string,
    parsedDocuments: ParsedDocument[],
    scoringConfig: VisaScoringConfig,
    userInfo: { name: string; email: string }
  ): string {
    const documentContent = this.formatDocumentContent(parsedDocuments);
    const categories = scoringConfig.categories.map(c => 
      `- ${c.name} (${c.weight}%): ${c.description}`
    ).join('\n');

    return `Evaluate the following visa application with detailed analysis:

**Country:** ${country}
**Visa Type:** ${visaType}
**Applicant:** ${userInfo.name}

**Document Content:**
${documentContent}

**Evaluation Categories:**
${categories}

Please provide a comprehensive evaluation in the following JSON format:
{
  "categoryScores": [
    {
      "category": "Category Name",
      "score": 0-100,
      "reasoning": "Brief explanation of score"
    }
  ],
  "summary": "2-3 sentence overview of the application",
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    "Specific recommendation 3"
  ],
  "conclusion": "Clear statement about application viability and next steps"
}

Ensure all category names match exactly the categories listed above.`;
  }

  /**
   * Build category scores with weights (internal use only)
   * Maps AI category scores to internal scoring structure
   */
  private buildCategoryScores(
    aiScores: any[],
    scoringConfig: VisaScoringConfig
  ): InternalCategoryScore[] {
    return scoringConfig.categories.map(category => {
      const aiScore = aiScores.find(s => s.category === category.name);
      const score = aiScore?.score || 50;
      const reasoning = aiScore?.reasoning || 'No specific feedback provided';

      return {
        category: category.name,
        score: Math.max(0, Math.min(100, score)),
        weight: category.weight,
        weightedScore: (score * category.weight) / 100,
        reasoning
      };
    });
  }

  /**
   * Calculate final weighted score (internal use only)
   * Sums weighted scores from all categories
   */
  private calculateWeightedScore(categoryScores: InternalCategoryScore[]): number {
    return categoryScores.reduce((sum, cat) => sum + cat.weightedScore, 0);
  }

  /**
   * Parse enhanced structured response from OpenAI
   * Calculates weighted score and returns user-facing fields only
   */
  private parseEnhancedResponse(
    response: OpenAI.Chat.Completions.ChatCompletion,
    scoringConfig: VisaScoringConfig
  ): EvaluationResult {
    const content = response.choices[0]?.message?.content || '';

    try {
      // Try to parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Calculate weighted score internally (not exposed to users)
        const categoryScores = this.buildCategoryScores(parsed.categoryScores, scoringConfig);
        const finalScore = this.calculateWeightedScore(categoryScores);

        // Log category breakdown for internal audit (not exposed to users)
        logger.info('Category scores calculated (internal audit only)', {
          categoryBreakdown: categoryScores.map(c => ({ 
            category: c.category, 
            score: c.score,
            weight: c.weight,
            weightedScore: c.weightedScore,
            reasoning: sanitizeForLogging(c.reasoning, 100)
          })),
          scoring: {
            finalScore: Math.round(finalScore),
            rawScore: finalScore,
            totalWeight: categoryScores.reduce((sum, c) => sum + c.weight, 0),
            averageCategoryScore: Math.round(
              categoryScores.reduce((sum, c) => sum + c.score, 0) / categoryScores.length
            )
          },
          note: 'Category scores are for internal audit only and not exposed to users'
        });

        // Return only user-facing fields
        return {
          score: Math.round(finalScore),
          summary: parsed.summary || 'Evaluation completed',
          recommendations: parsed.recommendations || [],
          conclusion: parsed.conclusion || 'Please review the evaluation details'
        };
      }
    } catch (error) {
      logger.warn('Failed to parse structured response, falling back to text parsing', { error });
    }

    // Fallback to text parsing if JSON parsing fails
    return this.parseTextResponse(content, scoringConfig);
  }

  /**
   * Fallback text parsing if JSON parsing fails
   * Extracts score and summary using regex patterns
   */
  private parseTextResponse(content: string, _scoringConfig: VisaScoringConfig): EvaluationResult {
    // Extract score
    const scoreMatch = content.match(/score[:\s]+(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 50;

    // Extract summary
    const summaryMatch = content.match(/summary[:\s]+(.+?)(?=\n\n|\n[A-Z]|$)/is);
    const summary = summaryMatch ? summaryMatch[1].trim() : content.substring(0, 200);

    // Log that we're using fallback parsing
    logger.warn('Using fallback text parsing for AI response');

    // Return only user-facing fields
    return {
      score: Math.max(0, Math.min(100, score)),
      summary,
      recommendations: [
        'Review all documentation for completeness',
        'Ensure all required documents are included',
        'Consider consulting with an immigration specialist'
      ],
      conclusion: 'Evaluation completed based on available information'
    };
  }

  /**
   * Parse structured response from AI into StructuredEvaluationResult
   * Validates criteriaAnalysis and prioritizedRecommendations structure
   * Uses scoreCalculation.adjustedScore as the final score
   */
  private parseStructuredResponse(
    response: OpenAI.Chat.Completions.ChatCompletion,
    scoreCalculation: ScoreCalculation,
    validationResults: ValidationResult[],
    visaCriteria: VisaCriteriaConfig
  ): StructuredEvaluationResult {
    const content = response.choices[0]?.message?.content || '';

    logger.debug('Parsing structured AI response', {
      contentLength: content.length,
      validationResultsCount: validationResults.length,
      calculatedScore: scoreCalculation.adjustedScore
    });

    try {
      // Extract JSON from response (handle cases where AI adds markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields for structured response
      if (!parsed.summary || !parsed.conclusion) {
        throw new Error('Missing required fields (summary or conclusion) in AI response');
      }

      // Validate criteriaAnalysis structure
      if (!Array.isArray(parsed.criteriaAnalysis)) {
        throw new Error('criteriaAnalysis must be an array');
      }

      for (const criterion of parsed.criteriaAnalysis) {
        if (!criterion.name || !criterion.rating || !Array.isArray(criterion.evidence) || !Array.isArray(criterion.gaps)) {
          throw new Error('Invalid criteriaAnalysis structure');
        }
        if (!['STRONG', 'GOOD', 'MODERATE', 'WEAK', 'CRITICAL_GAP'].includes(criterion.rating)) {
          throw new Error(`Invalid rating: ${criterion.rating}`);
        }
      }

      // Validate prioritizedRecommendations structure
      if (!Array.isArray(parsed.prioritizedRecommendations)) {
        throw new Error('prioritizedRecommendations must be an array');
      }

      for (const rec of parsed.prioritizedRecommendations) {
        if (!rec.priority || !rec.text) {
          throw new Error('Invalid prioritizedRecommendations structure');
        }
        if (!['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(rec.priority)) {
          throw new Error(`Invalid priority: ${rec.priority}`);
        }
      }

      logger.info('Structured response parsed successfully', {
        score: scoreCalculation.adjustedScore,
        criteriaAnalysisCount: parsed.criteriaAnalysis.length,
        recommendationCount: parsed.prioritizedRecommendations.length,
        summaryLength: parsed.summary.length,
        hasConclusion: !!parsed.conclusion
      });

      // Calculate approval likelihood
      const approvalLikelihood = this.calculateApprovalLikelihood(
        scoreCalculation.adjustedScore,
        validationResults,
        visaCriteria
      );

      // Return structured evaluation result using calculated score
      return {
        score: Math.round(scoreCalculation.adjustedScore),
        criteriaAnalysis: parsed.criteriaAnalysis,
        prioritizedRecommendations: parsed.prioritizedRecommendations,
        summary: parsed.summary,
        conclusion: parsed.conclusion,
        scoreBreakdown: {
          baseScore: scoreCalculation.baseScore,
          penalties: scoreCalculation.penalties,
          totalPenalty: scoreCalculation.totalPenalty,
          adjustedScore: scoreCalculation.adjustedScore,
          breakdown: scoreCalculation.breakdown
        },
        approvalLikelihood
      };
    } catch (error) {
      logger.error('Failed to parse structured AI response, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentPreview: content.substring(0, 200)
      });

      // Fallback: generate structured output from validation results
      return this.generateFallbackStructuredResponse(
        scoreCalculation,
        validationResults,
        visaCriteria
      );
    }
  }





  /**
   * Calculate approval likelihood based on score and critical requirements met
   * 80-100: "Strong", 60-79: "Good", 40-59: "Moderate", 20-39: "Needs Improvement", 0-19: "Low"
   * Override to "Not Viable" if multiple critical requirements missing
   */
  private calculateApprovalLikelihood(
    score: number,
    validationResults: ValidationResult[],
    _visaCriteria: VisaCriteriaConfig
  ): ApprovalLikelihood {
    // Count missing critical requirements
    const criticalResults = validationResults.filter(r => r.isCritical);
    const missingCritical = criticalResults.filter(r => !r.met).length;

    logger.debug('Calculating approval likelihood', {
      score,
      totalCriticalRequirements: criticalResults.length,
      missingCriticalRequirements: missingCritical
    });

    // Override to "Not Viable" if multiple critical requirements are missing
    if (missingCritical >= 2) {
      logger.info('Approval likelihood: Not Viable (multiple critical requirements missing)', {
        missingCritical,
        score
      });
      return 'Not Viable';
    }

    // Calculate based on score ranges
    let likelihood: ApprovalLikelihood;
    
    if (score >= 80) {
      likelihood = 'Strong';
    } else if (score >= 60) {
      likelihood = 'Good';
    } else if (score >= 40) {
      likelihood = 'Moderate';
    } else if (score >= 20) {
      likelihood = 'Needs Improvement';
    } else {
      likelihood = 'Low';
    }

    // Downgrade if one critical requirement is missing
    if (missingCritical === 1) {
      if (likelihood === 'Strong') {
        likelihood = 'Good';
      } else if (likelihood === 'Good') {
        likelihood = 'Moderate';
      } else if (likelihood === 'Moderate') {
        likelihood = 'Needs Improvement';
      }
      
      logger.info('Approval likelihood downgraded due to missing critical requirement', {
        originalLikelihood: likelihood,
        missingCritical: 1
      });
    }

    logger.info('Approval likelihood calculated', {
      score,
      likelihood,
      missingCriticalRequirements: missingCritical
    });

    return likelihood;
  }

  /**
   * Generate fallback structured response when AI doesn't return proper JSON
   * Maps validation results to criteriaAnalysis and generates prioritized recommendations
   */
  private generateFallbackStructuredResponse(
    scoreCalculation: ScoreCalculation,
    validationResults: ValidationResult[],
    visaCriteria: VisaCriteriaConfig
  ): StructuredEvaluationResult {
    logger.info('Generating fallback structured response from validation results', {
      validationResultsCount: validationResults.length,
      adjustedScore: scoreCalculation.adjustedScore
    });

    // Map validation results to criteriaAnalysis
    const criteriaAnalysis: CriterionAnalysis[] = validationResults.map(result => {
      // Determine rating based on score and whether it's met
      let rating: CriterionRating;
      if (!result.met && result.isCritical) {
        rating = 'CRITICAL_GAP';
      } else if (!result.met) {
        rating = 'WEAK';
      } else {
        const percentage = (result.score / result.maxScore) * 100;
        if (percentage >= 90) {
          rating = 'STRONG';
        } else if (percentage >= 70) {
          rating = 'GOOD';
        } else {
          rating = 'MODERATE';
        }
      }

      return {
        name: result.criterion,
        rating,
        evidence: result.evidence || [],
        gaps: !result.met ? [result.details] : [],
        recommendation: result.recommendation,
        isCritical: result.isCritical || false
      };
    });

    // Generate prioritized recommendations from validation failures
    const prioritizedRecommendations: PrioritizedRecommendation[] = [];

    // Add recommendations for failed critical requirements
    const failedCritical = validationResults.filter(r => !r.met && r.isCritical);
    for (const result of failedCritical) {
      if (result.recommendation) {
        prioritizedRecommendations.push({
          priority: 'CRITICAL',
          text: result.recommendation,
          relatedCriterion: result.criterion
        });
      }
    }

    // Add recommendations for failed non-critical requirements
    const failedNonCritical = validationResults.filter(r => !r.met && !r.isCritical);
    for (const result of failedNonCritical) {
      if (result.recommendation) {
        prioritizedRecommendations.push({
          priority: 'HIGH',
          text: result.recommendation,
          relatedCriterion: result.criterion
        });
      }
    }

    // Add general recommendations based on visa type
    if (visaCriteria.laborMarketTestRequired) {
      prioritizedRecommendations.push({
        priority: 'MEDIUM',
        text: 'Ensure employer completes the labor market test as required for this visa type',
        relatedCriterion: 'Labor Market Test'
      });
    }

    if (visaCriteria.sponsorRequired && visaCriteria.sponsorType) {
      prioritizedRecommendations.push({
        priority: 'MEDIUM',
        text: `Verify that your employer is registered as ${visaCriteria.sponsorType}`,
        relatedCriterion: 'Sponsor'
      });
    }

    // Add documentation recommendation
    prioritizedRecommendations.push({
      priority: 'LOW',
      text: 'Ensure all supporting documents are complete, certified, and translated if necessary',
      relatedCriterion: 'Documentation'
    });

    // Generate summary
    const criteriaMet = validationResults.filter(r => r.met).length;
    const totalCriteria = validationResults.length;
    const summary = `# Evaluation for ${visaCriteria.country} - ${visaCriteria.visaType}

${visaCriteria.description}

## Validation Summary

${criteriaMet} out of ${totalCriteria} criteria met.

${validationResults.map(r => `- **${r.criterion}**: ${r.met ? '✓ MET' : '✗ NOT MET'} - ${r.details}`).join('\n')}

**Note:** AI analysis was unavailable. This evaluation is based on automated validation of your documents against visa requirements.`;

    // Generate conclusion
    const approvalLikelihood = this.calculateApprovalLikelihood(
      scoreCalculation.adjustedScore,
      validationResults,
      visaCriteria
    );

    const conclusion = scoreCalculation.adjustedScore >= 70
      ? `Your application shows potential with a score of ${Math.round(scoreCalculation.adjustedScore)}/100. Address the recommendations above to improve your chances of approval.`
      : `Your application needs improvement with a score of ${Math.round(scoreCalculation.adjustedScore)}/100. Focus on meeting the mandatory requirements listed in the recommendations.`;

    return {
      score: Math.round(scoreCalculation.adjustedScore),
      criteriaAnalysis,
      prioritizedRecommendations,
      summary,
      conclusion,
      scoreBreakdown: {
        baseScore: scoreCalculation.baseScore,
        penalties: scoreCalculation.penalties,
        totalPenalty: scoreCalculation.totalPenalty,
        adjustedScore: scoreCalculation.adjustedScore,
        breakdown: scoreCalculation.breakdown
      },
      approvalLikelihood
    };
  }



  /**
   * Call OpenAI API with retry logic, exponential backoff, and timeout
   * Retries based on AI_RETRY_ATTEMPTS configuration
   * Supports abort signal for request cancellation
   */
  private async callOpenAIWithRetry(messages: any[], signal?: AbortSignal): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized - mock mode should be handled before calling this method');
    }
    
    const config = getConfig();
    const maxRetries = config.AI_RETRY_ATTEMPTS;
    const apiTimeout = config.AI_API_TIMEOUT_MS;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Check if request was aborted
      if (signal?.aborted) {
        throw new Error('Request aborted due to timeout');
      }

      try {
        const callStartTime = Date.now();
        
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`OpenAI API call timeout after ${apiTimeout}ms`));
          }, apiTimeout);
        });

        // Create API call promise
        const apiPromise = this.openai.chat.completions.create({
          model: this.model,
          messages,
          temperature: config.AI_TEMPERATURE,
          max_tokens: config.AI_MAX_TOKENS
        });

        // Race between API call and timeout
        const response = await Promise.race([apiPromise, timeoutPromise]);
        
        const callDuration = Date.now() - callStartTime;
        
        // Log successful call
        if (attempt > 0) {
          logger.info('OpenAI API call succeeded after retry', { 
            attempt,
            durationMs: callDuration
          });
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a timeout error
        const isTimeout = error instanceof Error && error.message.includes('timeout');
        
        logger.warn(`OpenAI API call failed (attempt ${attempt + 1}/${maxRetries + 1})`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          isTimeout
        });
        
        // Don't retry on abort signal
        if (signal?.aborted) {
          throw new Error('Request aborted due to timeout');
        }
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s
          const delay = 1000 * Math.pow(2, attempt);
          logger.info(`Retrying OpenAI API call in ${delay}ms`, {
            nextAttempt: attempt + 2,
            maxAttempts: maxRetries + 1
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Log OpenAI API usage statistics including token usage and estimated cost
   * Helps track API consumption and costs for monitoring and optimization
   */
  private logOpenAIUsage(
    response: OpenAI.Chat.Completions.ChatCompletion,
    durationMs: number
  ): void {
    const usage = response.usage;
    
    if (!usage) {
      logger.warn('OpenAI response missing usage data');
      return;
    }

    // Calculate estimated cost based on GPT-4 pricing
    // GPT-4: $0.03 per 1K prompt tokens, $0.06 per 1K completion tokens
    // GPT-4-turbo: $0.01 per 1K prompt tokens, $0.03 per 1K completion tokens
    const isGPT4Turbo = this.model.includes('turbo');
    const promptCostPer1K = isGPT4Turbo ? 0.01 : 0.03;
    const completionCostPer1K = isGPT4Turbo ? 0.03 : 0.06;
    
    const promptCost = (usage.prompt_tokens / 1000) * promptCostPer1K;
    const completionCost = (usage.completion_tokens / 1000) * completionCostPer1K;
    const totalCost = promptCost + completionCost;

    logger.info('OpenAI API usage and cost', {
      model: this.model,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      },
      cost: {
        promptCost: `$${promptCost.toFixed(4)}`,
        completionCost: `$${completionCost.toFixed(4)}`,
        totalCost: `$${totalCost.toFixed(4)}`,
        currency: 'USD'
      },
      performance: {
        durationMs,
        tokensPerSecond: Math.round((usage.total_tokens / durationMs) * 1000)
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log comprehensive evaluation completion metrics
   * Provides audit trail and performance monitoring data
   */
  private logEvaluationCompletion(params: {
    country: string;
    visaType: string;
    result: EvaluationResult;
    durationMs: number;
    mockMode: boolean;
    documentCount: number;
    parseDurationMs?: number;
    apiDurationMs?: number;
    usedFallback?: boolean;
  }): void {
    const {
      country,
      visaType,
      result,
      durationMs,
      mockMode,
      documentCount,
      parseDurationMs,
      apiDurationMs,
      usedFallback
    } = params;

    logger.info('Evaluation completed successfully', {
      evaluation: {
        country,
        visaType,
        score: result.score,
        hasRecommendations: !!result.recommendations,
        recommendationCount: result.recommendations?.length || 0,
        hasConclusion: !!result.conclusion,
        hasSummary: !!result.summary,
        summaryLength: result.summary?.length || 0
      },
      performance: {
        totalDurationMs: durationMs,
        parseDurationMs: parseDurationMs || 0,
        apiDurationMs: apiDurationMs || 0,
        otherDurationMs: durationMs - (parseDurationMs || 0) - (apiDurationMs || 0)
      },
      metadata: {
        documentCount,
        mockMode,
        usedFallback: usedFallback || false,
        timestamp: new Date().toISOString()
      },
      // Sanitized summary preview for audit
      summaryPreview: result.summary ? sanitizeForLogging(result.summary, 150) : null
    });
  }

  /**
   * Extract applicant data from parsed documents
   * Uses regex and text analysis to extract key information
   */
  private extractApplicantData(
    parsedDocuments: ParsedDocument[],
    userInfo: { name: string; email: string }
  ): ApplicantData {
    // Combine all successfully parsed document text
    const allText = parsedDocuments
      .filter(d => d.success)
      .map(d => d.extractedText)
      .join('\n');

    logger.debug('Extracting applicant data from documents', {
      totalTextLength: allText.length,
      documentCount: parsedDocuments.filter(d => d.success).length
    });

    // Extract data using helper methods
    const salaryData = this.extractSalary(allText);
    const education = this.extractEducation(allText);
    const experienceYears = this.extractExperience(allText);
    const occupation = this.extractOccupation(allText);
    const age = this.extractAge(allText);

    const applicantData: ApplicantData = {
      name: userInfo.name,
      email: userInfo.email,
      salary: salaryData.amount,
      salaryCurrency: salaryData.currency,
      salaryPeriod: salaryData.period,
      education,
      experienceYears,
      occupation,
      age
    };

    logger.debug('Applicant data extracted', {
      hasSalary: !!applicantData.salary,
      salaryCurrency: applicantData.salaryCurrency,
      salaryPeriod: applicantData.salaryPeriod,
      hasEducation: !!applicantData.education,
      hasExperience: applicantData.experienceYears !== undefined,
      hasOccupation: !!applicantData.occupation,
      hasAge: applicantData.age !== undefined
    });

    return applicantData;
  }

  /**
   * Extract salary from document text using regex patterns
   */
  private extractSalary(text: string): { amount?: number; currency?: string; period?: 'annual' | 'monthly' } {
    // Common salary patterns
    const patterns = [
      // Annual: $50,000 per year, €50000/year, 50k annually
      /(?:salary|compensation|pay|income)[:\s]+(?:of\s+)?([€$£¥]|EUR|USD|GBP|JPY|PLN)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*k?\s*(?:per\s+year|\/year|annually|per\s+annum|p\.a\.)/i,
      // Monthly: $5,000 per month, €5000/month, 5k monthly
      /(?:salary|compensation|pay|income)[:\s]+(?:of\s+)?([€$£¥]|EUR|USD|GBP|JPY|PLN)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*k?\s*(?:per\s+month|\/month|monthly)/i,
      // General: Salary: $50,000 or €50000
      /(?:salary|compensation|annual\s+salary|base\s+salary)[:\s]+([€$£¥]|EUR|USD|GBP|JPY|PLN)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*k?/i,
      // Offer letter: We are pleased to offer you $50,000
      /(?:offer\s+you|offering)[:\s]+([€$£¥]|EUR|USD|GBP|JPY|PLN)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*k?/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let currency = match[1] || 'USD';
        let amountStr = match[2].replace(/,/g, '');
        let amount = parseFloat(amountStr);

        // Handle 'k' notation (e.g., 50k = 50000)
        if (text.substring(match.index! + match[0].length - 1, match.index! + match[0].length).toLowerCase() === 'k') {
          amount *= 1000;
        }

        // Normalize currency symbols to codes
        const currencyMap: Record<string, string> = {
          '$': 'USD',
          '€': 'EUR',
          '£': 'GBP',
          '¥': 'JPY'
        };
        currency = currencyMap[currency] || currency;

        // Determine period (annual vs monthly)
        let period: 'annual' | 'monthly' = 'annual';
        if (match[0].toLowerCase().includes('month')) {
          period = 'monthly';
        }

        logger.debug('Salary extracted', { amount, currency, period, matchedText: match[0] });
        return { amount, currency, period };
      }
    }

    logger.debug('No salary found in documents');
    return {};
  }

  /**
   * Extract education level from document text
   */
  private extractEducation(text: string): string | undefined {
    const textLower = text.toLowerCase();

    // Check for PhD/Doctorate
    if (textLower.match(/\b(phd|ph\.d\.|doctorate|doctoral\s+degree)\b/)) {
      logger.debug('Education extracted: PhD');
      return 'PhD';
    }

    // Check for Master's
    if (textLower.match(/\b(master|master's|masters|msc|m\.sc\.|mba|m\.b\.a\.|ma|m\.a\.)\b/)) {
      logger.debug('Education extracted: Master');
      return 'Master';
    }

    // Check for Bachelor's
    if (textLower.match(/\b(bachelor|bachelor's|bachelors|bsc|b\.sc\.|ba|b\.a\.|undergraduate\s+degree)\b/)) {
      logger.debug('Education extracted: Bachelor');
      return 'Bachelor';
    }

    // Check for High School
    if (textLower.match(/\b(high\s+school|secondary\s+school|diploma|ged)\b/)) {
      logger.debug('Education extracted: High School');
      return 'High School';
    }

    logger.debug('No education level found in documents');
    return undefined;
  }

  /**
   * Extract years of experience from document text
   */
  private extractExperience(text: string): number | undefined {
    // Patterns for experience
    const patterns = [
      // "5 years of experience", "10+ years experience"
      /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+)?(?:work\s+)?experience/i,
      // "Experience: 5 years"
      /experience[:\s]+(\d+)\+?\s*(?:years?|yrs?)/i,
      // "Over 5 years in..."
      /over\s+(\d+)\s+(?:years?|yrs?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const years = parseInt(match[1], 10);
        logger.debug('Experience extracted', { years, matchedText: match[0] });
        return years;
      }
    }

    logger.debug('No experience years found in documents');
    return undefined;
  }

  /**
   * Extract occupation/job title from document text
   */
  private extractOccupation(text: string): string | undefined {
    // Patterns for job titles
    const patterns = [
      // "Position: Software Engineer"
      /(?:position|role|job\s+title|title)[:\s]+([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Consultant|Specialist|Director|Designer|Architect))/,
      // "as a Software Engineer"
      /as\s+a\s+([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Consultant|Specialist|Director|Designer|Architect))/,
      // "Software Engineer at Company"
      /([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Consultant|Specialist|Director|Designer|Architect))\s+at\s+/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const occupation = match[1].trim();
        logger.debug('Occupation extracted', { occupation, matchedText: match[0] });
        return occupation;
      }
    }

    logger.debug('No occupation found in documents');
    return undefined;
  }

  /**
   * Extract age from document text
   */
  private extractAge(text: string): number | undefined {
    // Patterns for age
    const patterns = [
      // "Age: 30", "Age 30"
      /\bage[:\s]+(\d{2})\b/i,
      // "30 years old"
      /\b(\d{2})\s+years?\s+old\b/i,
      // "Born in 1990" (calculate age)
      /\bborn\s+in\s+(\d{4})\b/i,
      // "Date of Birth: 01/01/1990"
      /date\s+of\s+birth[:\s]+\d{1,2}[\/\-]\d{1,2}[\/\-](\d{4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let age: number;
        
        if (match[0].toLowerCase().includes('born') || match[0].toLowerCase().includes('birth')) {
          // Calculate age from birth year
          const birthYear = parseInt(match[1], 10);
          const currentYear = new Date().getFullYear();
          age = currentYear - birthYear;
        } else {
          age = parseInt(match[1], 10);
        }

        // Validate age is reasonable (18-100)
        if (age >= 18 && age <= 100) {
          logger.debug('Age extracted', { age, matchedText: match[0] });
          return age;
        }
      }
    }

    logger.debug('No age found in documents');
    return undefined;
  }

  /**
   * Fallback evaluation when AI API fails
   * Provides basic scoring based on document count
   */
  private fallbackEvaluation(params: EvaluateParams): EvaluationResult {
    const { country, visaType, documents } = params;
    
    // Basic scoring: 50 base + 10 per document (max 40)
    const score = Math.min(50 + (documents.length * 10), 90);

    const summary = `Evaluation completed for ${country} - ${visaType}. ` +
      `Reviewed ${documents.length} document(s). ` +
      `Note: AI analysis unavailable, basic evaluation provided. ` +
      `Please ensure all required documents are included for accurate assessment.`;

    logger.warn('Using fallback evaluation', { country, visaType, score });

    return { score, summary };
  }
}
