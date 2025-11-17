import OpenAI from 'openai';
import { IEvaluator, EvaluateParams, EvaluationResult } from './evaluatorInterface';
import { getConfig } from '../../config/environment';
import { logger } from '../../config/logger';

/**
 * AI-based evaluator implementation using OpenAI API
 * Analyzes visa applications using GPT models for intelligent scoring
 */
export class AIEvaluator implements IEvaluator {
  private openai: OpenAI;
  private model: string;

  constructor() {
    const config = getConfig();
    
    if (!config.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for AI evaluator');
    }

    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY
    });
    
    this.model = config.AI_MODEL || 'gpt-4';
  }

  /**
   * Evaluate visa application using AI analysis
   */
  async evaluate(params: EvaluateParams): Promise<EvaluationResult> {
    const { country, visaType, documents, userInfo } = params;

    try {
      // Summarize documents for AI context
      const documentSummary = this.summarizeDocuments(documents);

      // Create evaluation prompt
      const prompt = this.createEvaluationPrompt(
        country,
        visaType,
        documentSummary,
        userInfo
      );

      // Call OpenAI API
      logger.info('Calling OpenAI API for visa evaluation', {
        country,
        visaType,
        documentCount: documents.length
      });

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert immigration consultant specializing in visa applications. Provide objective, professional evaluations based on documentation quality and completeness.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      // Parse AI response
      const result = this.parseAIResponse(response);

      logger.info('AI evaluation completed', {
        country,
        visaType,
        score: result.score
      });

      return result;

    } catch (error) {
      logger.error('AI evaluation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        country,
        visaType
      });

      // Fallback to basic evaluation on error
      return this.fallbackEvaluation(params);
    }
  }

  /**
   * Summarize uploaded documents for AI context
   */
  private summarizeDocuments(documents: any[]): string {
    if (documents.length === 0) {
      return 'No documents provided';
    }

    const documentList = documents.map((doc, index) => {
      const name = doc.originalName || doc.filename;
      return `${index + 1}. ${name}`;
    }).join('\n');

    return `Documents provided (${documents.length} total):\n${documentList}`;
  }

  /**
   * Create evaluation prompt for OpenAI
   */
  private createEvaluationPrompt(
    country: string,
    visaType: string,
    documentSummary: string,
    userInfo: { name: string; email: string }
  ): string {
    return `Evaluate the following visa application:

**Country:** ${country}
**Visa Type:** ${visaType}
**Applicant:** ${userInfo.name}

**Documents Submitted:**
${documentSummary}

Please provide:
1. A numerical score from 0-100 representing the likelihood of visa approval based on documentation completeness and quality
2. A brief professional summary (2-3 sentences) explaining the score and providing actionable recommendations

Format your response as:
SCORE: [number]
SUMMARY: [your evaluation summary]`;
  }

  /**
   * Parse OpenAI API response to extract score and summary
   */
  private parseAIResponse(response: OpenAI.Chat.Completions.ChatCompletion): EvaluationResult {
    const content = response.choices[0]?.message?.content || '';

    // Extract score using regex
    const scoreMatch = content.match(/SCORE:\s*(\d+)/i);
    let score = scoreMatch ? parseInt(scoreMatch[1], 10) : 50;

    // Ensure score is within valid range
    score = Math.max(0, Math.min(score, 100));

    // Extract summary using regex
    const summaryMatch = content.match(/SUMMARY:\s*(.+)/is);
    let summary = summaryMatch ? summaryMatch[1].trim() : content;

    // Clean up summary (remove extra whitespace, limit length)
    summary = summary
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // If summary is too long, truncate it
    if (summary.length > 500) {
      summary = summary.substring(0, 497) + '...';
    }

    // If no valid summary extracted, provide default
    if (!summary || summary.length < 10) {
      summary = 'AI evaluation completed. Please review your documentation and ensure all required materials are included.';
    }

    return { score, summary };
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
