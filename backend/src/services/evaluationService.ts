import { IEvaluator } from './evaluators/evaluatorInterface';
import { FileService } from './fileService';
import { EmailService } from './emailService';
import { EvaluationRepository } from '../repositories/evaluationRepository';
import { VisaTypeRepository } from '../repositories/visaTypeRepository';
import { IEvaluation } from '../types/evaluation.types';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../config/logger';
import { getConfig } from '../config/environment';
import mongoose from 'mongoose';

/**
 * Parameters for processing a new evaluation
 */
export interface ProcessEvaluationParams {
  name: string;
  email: string;
  country: string;
  visaType: string;
  documents: Express.Multer.File[];
  partnerId?: mongoose.Types.ObjectId | string;
}

/**
 * Result of evaluation processing
 */
export interface EvaluationResult {
  evaluationId: string;
  score: number;
  summary: string;
  evaluation: IEvaluation;
}

/**
 * Options for listing evaluations
 */
export interface ListEvaluationsOptions {
  page?: number;
  limit?: number;
  partnerId?: mongoose.Types.ObjectId | string;
  email?: string;
  country?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Core evaluation service that orchestrates the complete evaluation workflow
 * Handles document validation, storage, scoring, and notification
 */
export class EvaluationService {
  constructor(
    private evaluator: IEvaluator,
    private fileService: FileService,
    private emailService: EmailService,
    private evaluationRepository: EvaluationRepository,
    private visaTypeRepository: VisaTypeRepository
  ) {
    logger.info('EvaluationService initialized');
  }

  /**
   * Process a complete visa evaluation workflow
   * 
   * Steps:
   * 1. Validate visa type exists
   * 2. Validate required documents are provided
   * 3. Store uploaded documents
   * 4. Create evaluation record
   * 5. Generate evaluation score and summary
   * 6. Apply success cap to score
   * 7. Update evaluation with results
   * 8. Send email notification
   * 9. Return results
   * 
   * @param params - Evaluation parameters
   * @returns Evaluation result with score and summary
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If visa type doesn't exist
   */
  async processEvaluation(params: ProcessEvaluationParams): Promise<EvaluationResult> {
    const { name, email, country, visaType, documents, partnerId } = params;

    logger.info('Starting evaluation process', {
      email,
      country,
      visaType,
      documentCount: documents.length,
      partnerId: partnerId?.toString()
    });

    try {
      // Step 1: Validate visa type exists
      const visaTypeConfig = await this.validateVisaType(country, visaType);

      // Step 2: Validate required documents
      this.validateRequiredDocuments(documents, visaTypeConfig.requiredDocuments);

      // Step 3: Store uploaded documents with error handling
      logger.debug('Storing uploaded documents', { count: documents.length });
      let storedFiles;
      try {
        storedFiles = await this.fileService.storeDocuments(documents);
      } catch (error) {
        logger.error('Failed to store uploaded documents', {
          error: error instanceof Error ? error.message : 'Unknown error',
          documentCount: documents.length
        });
        throw new Error('Failed to store uploaded documents. Please try again.');
      }

      // Step 4: Create evaluation record with error handling
      logger.debug('Creating evaluation record');
      let evaluation;
      try {
        evaluation = await this.evaluationRepository.create({
          userInfo: {
            name,
            email: email.toLowerCase()
          },
          visaApplication: {
            country,
            visaType
          },
          documents: storedFiles.map(file => ({
            filename: file.filename,
            originalName: file.originalName,
            path: file.path,
            uploadedAt: file.uploadedAt
          })),
          partnerId: partnerId ? new mongoose.Types.ObjectId(partnerId.toString()) : undefined
        });
      } catch (error) {
        logger.error('Failed to create evaluation record', {
          error: error instanceof Error ? error.message : 'Unknown error',
          email
        });
        // Clean up stored files on database error
        await this.cleanupStoredFiles(storedFiles);
        throw new Error('Failed to create evaluation record. Please try again.');
      }

      logger.info('Evaluation record created', {
        evaluationId: evaluation.evaluationId
      });

      // Step 5: Generate evaluation score and summary with error handling
      logger.debug('Generating evaluation score', {
        evaluationId: evaluation.evaluationId
      });

      let evaluationResult;
      try {
        evaluationResult = await this.evaluator.evaluate({
          country,
          visaType,
          documents: storedFiles.map(file => ({
            filename: file.filename,
            originalName: file.originalName,
            path: file.path
          })),
          userInfo: { name, email }
        });
      } catch (error) {
        logger.error('Failed to generate evaluation score', {
          error: error instanceof Error ? error.message : 'Unknown error',
          evaluationId: evaluation.evaluationId
        });
        throw new Error('Failed to generate evaluation. Please try again.');
      }

      // Step 6: Apply success cap
      const cappedScore = this.applySuccessCap(evaluationResult.score);

      logger.info('Evaluation completed', {
        evaluationId: evaluation.evaluationId,
        originalScore: evaluationResult.score,
        cappedScore,
        successCap: getConfig().SUCCESS_CAP
      });

      // Step 7: Update evaluation with results
      let updatedEvaluation: IEvaluation | null;
      
      // Check if evaluationResult has structured data (from visa-specific evaluation)
      const structuredResult = (evaluationResult as any).structuredResult;
      
      if (structuredResult) {
        // Use structured update method to save all enhanced fields
        logger.debug('Updating evaluation with structured results', {
          evaluationId: evaluation.evaluationId,
          hasCriteriaAnalysis: !!structuredResult.criteriaAnalysis,
          hasPrioritizedRecommendations: !!structuredResult.prioritizedRecommendations,
          hasScoreBreakdown: !!structuredResult.scoreBreakdown,
          hasApprovalLikelihood: !!structuredResult.approvalLikelihood
        });
        
        updatedEvaluation = await this.evaluationRepository.updateStructuredResults(
          evaluation.evaluationId,
          {
            score: cappedScore,
            summary: structuredResult.summary,
            recommendations: structuredResult.prioritizedRecommendations?.map((r: any) => r.text),
            conclusion: structuredResult.conclusion,
            criteriaAnalysis: structuredResult.criteriaAnalysis,
            prioritizedRecommendations: structuredResult.prioritizedRecommendations,
            scoreBreakdown: structuredResult.scoreBreakdown,
            approvalLikelihood: structuredResult.approvalLikelihood
          }
        );
      } else {
        // Use legacy update method for backward compatibility
        logger.debug('Updating evaluation with legacy results', {
          evaluationId: evaluation.evaluationId
        });
        
        updatedEvaluation = await this.evaluationRepository.updateResults(
          evaluation.evaluationId,
          cappedScore,
          evaluationResult.summary,
          evaluationResult.recommendations,
          evaluationResult.conclusion
        );
      }

      if (!updatedEvaluation) {
        throw new Error('Failed to update evaluation with results');
      }

      // Step 8: Send email notification (non-blocking with retry)
      this.sendEmailNotificationWithRetry({
        email,
        name,
        score: cappedScore,
        summary: evaluationResult.summary,
        evaluationId: evaluation.evaluationId,
        recommendations: evaluationResult.recommendations,
        conclusion: evaluationResult.conclusion,
        evaluation: updatedEvaluation // Pass full evaluation for PDF generation
      }).catch(error => {
        // Email errors are logged but don't fail the evaluation
        logger.error('Email notification failed after all retries', {
          error: error instanceof Error ? error.message : 'Unknown error',
          evaluationId: evaluation.evaluationId,
          email
        });
        // Store failed email for manual retry
        this.storeFailedEmailNotification(evaluation.evaluationId, email, error);
      });

      // Step 9: Return results
      return {
        evaluationId: evaluation.evaluationId,
        score: cappedScore,
        summary: evaluationResult.summary,
        evaluation: updatedEvaluation
      };

    } catch (error) {
      logger.error('Evaluation process failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        country,
        visaType
      });
      throw error;
    }
  }

  /**
   * Validate that the visa type exists and is active
   * 
   * @param country - Country name
   * @param visaType - Visa type name
   * @returns Visa type configuration
   * @throws {NotFoundError} If visa type doesn't exist
   * @throws {ValidationError} If visa type is inactive
   */
  private async validateVisaType(country: string, visaType: string) {
    const visaTypeConfig = await this.visaTypeRepository.findByCountryAndType(
      country,
      visaType
    );

    if (!visaTypeConfig) {
      throw new NotFoundError(
        `Visa type "${visaType}" for country "${country}"`
      );
    }

    if (!visaTypeConfig.active) {
      throw new ValidationError(
        `Visa type "${visaType}" for country "${country}" is not currently available`
      );
    }

    return visaTypeConfig;
  }

  /**
   * Validate that all required documents are provided
   * 
   * @param documents - Uploaded documents
   * @param requiredDocuments - Required document types from visa configuration
   * @throws {ValidationError} If required documents are missing
   */
  private validateRequiredDocuments(
    documents: Express.Multer.File[],
    requiredDocuments: string[]
  ): void {
    if (documents.length === 0) {
      throw new ValidationError('At least one document must be uploaded');
    }

    // For now, we just check that documents are provided
    // In a more sophisticated implementation, we could validate document types
    // by checking filenames or using document classification
    
    if (documents.length < requiredDocuments.length) {
      logger.warn('Fewer documents uploaded than required', {
        uploaded: documents.length,
        required: requiredDocuments.length,
        requiredTypes: requiredDocuments
      });
    }

    logger.debug('Document validation passed', {
      uploadedCount: documents.length,
      requiredCount: requiredDocuments.length
    });
  }

  /**
   * Apply configurable success cap to evaluation score
   * Ensures no score exceeds the configured maximum
   * 
   * @param score - Original evaluation score
   * @returns Capped score
   */
  private applySuccessCap(score: number): number {
    const config = getConfig();
    const cap = config.SUCCESS_CAP;

    if (score > cap) {
      logger.debug('Applying success cap', {
        originalScore: score,
        cap,
        cappedScore: cap
      });
      return cap;
    }

    return score;
  }

  /**
   * Send email notification with evaluation results
   * This is a non-blocking operation that logs errors but doesn't throw
   * 
   * @param params - Email parameters
   */
  private async sendEmailNotification(params: {
    email: string;
    name: string;
    score: number;
    summary: string;
    evaluationId: string;
    recommendations?: string[];
    conclusion?: string;
    evaluation: IEvaluation;
  }): Promise<void> {
    try {
      await this.emailService.sendEvaluationResults(params);
      logger.info('Email notification sent', {
        email: params.email,
        evaluationId: params.evaluationId
      });
    } catch (error) {
      // Errors are logged in emailService, just re-throw for caller to handle
      throw error;
    }
  }

  /**
   * Send email notification with retry logic
   * Retries up to 3 times with exponential backoff
   * 
   * @param params - Email parameters
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   */
  private async sendEmailNotificationWithRetry(
    params: {
      email: string;
      name: string;
      score: number;
      summary: string;
      evaluationId: string;
      recommendations?: string[];
      conclusion?: string;
      evaluation: IEvaluation;
    },
    maxRetries: number = 3
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.sendEmailNotification(params);
        
        if (attempt > 1) {
          logger.info('Email notification sent successfully after retry', {
            email: params.email,
            evaluationId: params.evaluationId,
            attempt
          });
        }
        
        return; // Success, exit
      } catch (error) {
        lastError = error as Error;
        
        logger.warn('Email notification attempt failed', {
          email: params.email,
          evaluationId: params.evaluationId,
          attempt,
          maxRetries,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Don't retry on the last attempt
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = 1000 * Math.pow(2, attempt - 1);
          logger.debug('Retrying email notification', {
            evaluationId: params.evaluationId,
            nextAttempt: attempt + 1,
            delayMs: delay
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Email notification failed after all retries');
  }

  /**
   * Store failed email notification for manual retry
   * Logs the failure for monitoring and potential manual intervention
   * 
   * @param evaluationId - Evaluation ID
   * @param email - Recipient email
   * @param error - Error that occurred
   */
  private storeFailedEmailNotification(
    evaluationId: string,
    email: string,
    error: unknown
  ): void {
    logger.error('Storing failed email notification for manual retry', {
      evaluationId,
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // In a production system, you might want to:
    // 1. Store in a database table for failed emails
    // 2. Send to a dead letter queue
    // 3. Trigger an alert to operations team
    // 4. Create a ticket in your issue tracking system
  }

  /**
   * Clean up stored files in case of error
   * Attempts to delete files that were successfully stored before an error occurred
   * 
   * @param storedFiles - Array of stored file metadata
   */
  private async cleanupStoredFiles(storedFiles: Array<{ path: string; filename: string }>): Promise<void> {
    logger.info('Cleaning up stored files after error', {
      fileCount: storedFiles.length
    });

    for (const file of storedFiles) {
      try {
        await this.fileService.deleteDocument(file.path);
        logger.debug('Cleaned up file', { filename: file.filename });
      } catch (error) {
        // Log but don't throw - cleanup is best effort
        logger.warn('Failed to clean up file', {
          filename: file.filename,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Get evaluation by ID
   * 
   * @param evaluationId - Unique evaluation identifier
   * @returns Evaluation document
   * @throws {NotFoundError} If evaluation doesn't exist
   */
  async getEvaluationById(evaluationId: string): Promise<IEvaluation> {
    logger.debug('Fetching evaluation by ID', { evaluationId });

    const evaluation = await this.evaluationRepository.findById(evaluationId);

    if (!evaluation) {
      throw new NotFoundError(`Evaluation with ID "${evaluationId}"`);
    }

    return evaluation;
  }

  /**
   * List evaluations with pagination and filtering
   * 
   * @param options - Filtering and pagination options
   * @returns Paginated evaluation results
   */
  async listEvaluations(options: ListEvaluationsOptions = {}) {
    const {
      page = 1,
      limit = 20,
      partnerId,
      email,
      country,
      startDate,
      endDate
    } = options;

    logger.debug('Listing evaluations', {
      page,
      limit,
      partnerId: partnerId?.toString(),
      email,
      country,
      startDate,
      endDate
    });

    // Build filters
    const filters: any = {};

    if (partnerId) {
      filters.partnerId = partnerId;
    }

    if (email) {
      filters.email = email.toLowerCase();
    }

    if (country) {
      filters.country = country;
    }

    if (startDate) {
      filters.startDate = startDate;
    }

    if (endDate) {
      filters.endDate = endDate;
    }

    // Query with pagination
    const result = await this.evaluationRepository.list(filters, {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    logger.info('Evaluations retrieved', {
      count: result.data.length,
      total: result.pagination.total,
      page: result.pagination.page
    });

    return result;
  }
}
