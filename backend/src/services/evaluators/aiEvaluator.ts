import OpenAI from 'openai';
import { IEvaluator, EvaluateParams, EvaluationResult } from './evaluatorInterface';
import { getConfig } from '../../config/environment';
import { logger } from '../../config/logger';
import { DocumentParser, ParsedDocument } from '../documentParser';
import { getScoringConfig, VisaScoringConfig, InternalCategoryScore } from '../../config/scoringCategories';
import { getMockResponse } from './mockAIResponses';

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

    try {
      // Get scoring configuration
      const scoringConfig = getScoringConfig(country, visaType);
      
      // If mock mode is enabled, return mock response
      if (this.mockMode) {
        logger.info('Using mock AI response for evaluation', {
          country,
          visaType,
          documentCount: documents.length,
          mockMode: true
        });
        
        return this.getMockEvaluation(country, visaType, scoringConfig);
      }

      // Parse document content
      const parsedDocuments = await this.documentParser.parseDocuments(documents);
      
      // Create enhanced prompt with actual content
      const prompt = this.createEnhancedPrompt(
        country,
        visaType,
        parsedDocuments,
        scoringConfig,
        userInfo
      );

      // Call OpenAI API with retry logic
      logger.info('Calling OpenAI API for enhanced visa evaluation', {
        country,
        visaType,
        documentCount: documents.length,
        parsedDocuments: parsedDocuments.filter(d => d.success).length
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

      // Parse structured response
      const result = this.parseEnhancedResponse(response, scoringConfig);

      logger.info('Enhanced AI evaluation completed', {
        country,
        visaType,
        score: result.score,
        hasRecommendations: !!result.recommendations,
        hasConclusion: !!result.conclusion
      });

      return result;

    } catch (error) {
      logger.error('Enhanced AI evaluation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        country,
        visaType
      });

      // Fallback to basic evaluation on error
      return this.fallbackEvaluation(params);
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
    logger.info('Mock evaluation - Category scores calculated', {
      categories: categoryScores.map(c => ({ 
        category: c.category, 
        score: c.score, 
        weight: c.weight 
      })),
      finalScore: Math.round(finalScore),
      mockMode: true
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

        // Log category breakdown for internal audit
        logger.info('Category scores calculated', {
          categories: categoryScores.map(c => ({ 
            category: c.category, 
            score: c.score, 
            weight: c.weight 
          })),
          finalScore: Math.round(finalScore)
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
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages,
          temperature: config.AI_TEMPERATURE,
          max_tokens: config.AI_MAX_TOKENS
        });
        
        // Log successful call
        if (attempt > 0) {
          logger.info('OpenAI API call succeeded after retry', { attempt });
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`OpenAI API call failed (attempt ${attempt + 1}/${maxRetries + 1})`, { 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s
          const delay = 1000 * Math.pow(2, attempt);
          logger.info(`Retrying OpenAI API call in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
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
