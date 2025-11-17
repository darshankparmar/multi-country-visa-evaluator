import OpenAI from 'openai';
import { IEvaluator, EvaluateParams, EvaluationResult } from './evaluatorInterface';
import { getConfig } from '../../config/environment';
import { logger } from '../../config/logger';
import { DocumentParser, ParsedDocument } from '../documentParser';
import { getScoringConfig, VisaScoringConfig, InternalCategoryScore } from '../../config/scoringCategories';
import { getMockResponse } from './mockAIResponses';
import { sanitizeForLogging } from '../../utils/piiSanitizer';

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
   */
  async evaluate(params: EvaluateParams): Promise<EvaluationResult> {
    const { country, visaType, documents, userInfo } = params;
    const evaluationStartTime = Date.now();

    try {
      // Get scoring configuration
      const scoringConfig = getScoringConfig(country, visaType);
      
      logger.info('Starting AI evaluation', {
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
      logger.info('Calling OpenAI API for enhanced visa evaluation', {
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

    } catch (error) {
      const errorDuration = Date.now() - evaluationStartTime;
      
      logger.error('Enhanced AI evaluation failed', {
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
   * Call OpenAI API with retry logic and exponential backoff
   * Retries based on AI_RETRY_ATTEMPTS configuration
   */
  private async callOpenAIWithRetry(messages: any[]): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized - mock mode should be handled before calling this method');
    }
    
    const config = getConfig();
    const maxRetries = config.AI_RETRY_ATTEMPTS;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const callStartTime = Date.now();
        
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages,
          temperature: config.AI_TEMPERATURE,
          max_tokens: config.AI_MAX_TOKENS
        });
        
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
        logger.warn(`OpenAI API call failed (attempt ${attempt + 1}/${maxRetries + 1})`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        });
        
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
