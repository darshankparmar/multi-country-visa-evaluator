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

      // Step 3: Store uploaded documents
      logger.debug('Storing uploaded documents', { count: documents.length });
      const storedFiles = await this.fileService.storeDocuments(documents);

      // Step 4: Create evaluation record
      logger.debug('Creating evaluation record');
      const evaluation = await this.evaluationRepository.create({
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

      logger.info('Evaluation record created', {
        evaluationId: evaluation.evaluationId
      });

      // Step 5: Generate evaluation score and summary
      logger.debug('Generating evaluation score', {
        evaluationId: evaluation.evaluationId
      });

      const evaluationResult = await this.evaluator.evaluate({
        country,
        visaType,
        documents: storedFiles.map(file => ({
          filename: file.filename,
          originalName: file.originalName,
          path: file.path
        })),
        userInfo: { name, email }
      });

      // Step 6: Apply success cap
      const cappedScore = this.applySuccessCap(evaluationResult.score);

      logger.info('Evaluation completed', {
        evaluationId: evaluation.evaluationId,
        originalScore: evaluationResult.score,
        cappedScore,
        successCap: getConfig().SUCCESS_CAP
      });

      // Step 7: Update evaluation with results
      const updatedEvaluation = await this.evaluationRepository.updateResults(
        evaluation.evaluationId,
        cappedScore,
        evaluationResult.summary,
        evaluationResult.recommendations,
        evaluationResult.conclusion
      );

      if (!updatedEvaluation) {
        throw new Error('Failed to update evaluation with results');
      }

      // Step 8: Send email notification (non-blocking)
      this.sendEmailNotification({
        email,
        name,
        score: cappedScore,
        summary: evaluationResult.summary,
        evaluationId: evaluation.evaluationId,
        recommendations: evaluationResult.recommendations,
        conclusion: evaluationResult.conclusion
      }).catch(error => {
        // Email errors are logged but don't fail the evaluation
        logger.error('Email notification failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          evaluationId: evaluation.evaluationId
        });
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
