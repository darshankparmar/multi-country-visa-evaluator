import { Request, Response, NextFunction } from 'express';
import { EvaluationService } from '../services/evaluationService';
import { CreateEvaluationRequest, ListEvaluationsQuery } from '../types/evaluation.types';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse';
import { ValidationError } from '../utils/errors';
import { logger } from '../config/logger';
import { getEvaluator } from '../services/evaluators/evaluatorFactory';
import { FileService } from '../services/fileService';
import { EmailService } from '../services/emailService';
import { EvaluationRepository } from '../repositories/evaluationRepository';
import { VisaTypeRepository } from '../repositories/visaTypeRepository';

/**
 * Initialize evaluation service with dependencies
 */
function getEvaluationService(): EvaluationService {
  const evaluator = getEvaluator();
  const fileService = new FileService();
  const emailService = new EmailService();
  const evaluationRepository = new EvaluationRepository();
  const visaTypeRepository = new VisaTypeRepository();

  return new EvaluationService(
    evaluator,
    fileService,
    emailService,
    evaluationRepository,
    visaTypeRepository
  );
}

/**
 * Create a new visa evaluation
 * POST /api/evaluations
 * 
 * Handles file uploads, validates input, processes evaluation through service layer
 * Returns evaluation ID, score, and summary
 */
export async function createEvaluation(
  req: Request<{}, {}, CreateEvaluationRequest>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, country, visaType } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    logger.info('Creating new evaluation', {
      requestId: req.requestId,
      email,
      country,
      visaType,
      fileCount: files?.length || 0,
      partnerId: req.partner?._id?.toString()
    });

    // Validate that documents are provided
    if (!files || files.length === 0) {
      throw new ValidationError('At least one document file is required');
    }

    // Get evaluation service
    const evaluationService = getEvaluationService();

    // Process evaluation
    const result = await evaluationService.processEvaluation({
      name,
      email,
      country,
      visaType,
      documents: files,
      partnerId: req.partner?._id
    });

    logger.info('Evaluation created successfully', {
      requestId: req.requestId,
      evaluationId: result.evaluationId,
      score: result.score
    });

    // Return created response with evaluation results including structured fields
    sendCreated(res, {
      evaluationId: result.evaluationId,
      score: result.score,
      summary: result.summary,
      recommendations: result.evaluation.results?.recommendations,
      conclusion: result.evaluation.results?.conclusion,
      // Include structured fields if present
      criteriaAnalysis: result.evaluation.results?.criteriaAnalysis,
      prioritizedRecommendations: result.evaluation.results?.prioritizedRecommendations,
      scoreBreakdown: result.evaluation.results?.scoreBreakdown,
      approvalLikelihood: result.evaluation.results?.approvalLikelihood,
      validationResults: result.evaluation.results?.validationResults,
      userInfo: {
        name: result.evaluation.userInfo.name,
        email: result.evaluation.userInfo.email
      },
      visaApplication: {
        country: result.evaluation.visaApplication.country,
        visaType: result.evaluation.visaApplication.visaType
      },
      createdAt: result.evaluation.createdAt
    }, 'Evaluation created successfully');

  } catch (error) {
    logger.error('Failed to create evaluation', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
}

/**
 * Get evaluation by ID
 * GET /api/evaluations/:id
 * 
 * Retrieves complete evaluation details including documents and results
 */
export async function getEvaluation(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    logger.debug('Fetching evaluation', {
      requestId: req.requestId,
      evaluationId: id
    });

    // Get evaluation service
    const evaluationService = getEvaluationService();

    // Fetch evaluation
    const evaluation = await evaluationService.getEvaluationById(id);

    logger.info('Evaluation retrieved successfully', {
      requestId: req.requestId,
      evaluationId: id
    });

    // Return evaluation data with all structured fields
    sendSuccess(res, {
      evaluationId: evaluation.evaluationId,
      userInfo: {
        name: evaluation.userInfo.name,
        email: evaluation.userInfo.email
      },
      visaApplication: {
        country: evaluation.visaApplication.country,
        visaType: evaluation.visaApplication.visaType
      },
      documents: evaluation.documents.map(doc => ({
        filename: doc.filename,
        originalName: doc.originalName,
        uploadedAt: doc.uploadedAt
      })),
      results: evaluation.results ? {
        score: evaluation.results.score,
        summary: evaluation.results.summary,
        recommendations: evaluation.results.recommendations,
        conclusion: evaluation.results.conclusion,
        evaluatedAt: evaluation.results.evaluatedAt,
        // Include structured fields if present
        criteriaAnalysis: evaluation.results.criteriaAnalysis,
        prioritizedRecommendations: evaluation.results.prioritizedRecommendations,
        scoreBreakdown: evaluation.results.scoreBreakdown,
        approvalLikelihood: evaluation.results.approvalLikelihood,
        validationResults: evaluation.results.validationResults
      } : undefined,
      partnerId: evaluation.partnerId?.toString(),
      createdAt: evaluation.createdAt
    });

  } catch (error) {
    logger.error('Failed to fetch evaluation', {
      requestId: req.requestId,
      evaluationId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
}

/**
 * List evaluations with pagination and filtering
 * GET /api/evaluations
 * 
 * Requires partner authentication
 * Returns only evaluations associated with the authenticated partner
 * Supports pagination and date range filtering
 */
export async function listEvaluations(
  req: Request<{}, {}, {}, ListEvaluationsQuery>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = req.query;

    logger.debug('Listing evaluations', {
      requestId: req.requestId,
      partnerId: req.partner?._id?.toString(),
      query
    });

    // Get evaluation service
    const evaluationService = getEvaluationService();

    // Build filter options
    const options: any = {
      page: query.page,
      limit: query.limit,
      partnerId: req.partner?._id, // Filter by authenticated partner
      email: query.email,
      country: query.country
    };

    // Parse date filters if provided
    if (query.startDate) {
      options.startDate = new Date(query.startDate);
    }

    if (query.endDate) {
      options.endDate = new Date(query.endDate);
    }

    // Fetch evaluations
    const result = await evaluationService.listEvaluations(options);

    logger.info('Evaluations listed successfully', {
      requestId: req.requestId,
      partnerId: req.partner?._id?.toString(),
      count: result.data.length,
      total: result.pagination.total
    });

    // Map evaluations to response format with all structured fields
    const evaluations = result.data.map(evaluation => ({
      evaluationId: evaluation.evaluationId,
      userInfo: {
        name: evaluation.userInfo.name,
        email: evaluation.userInfo.email
      },
      visaApplication: {
        country: evaluation.visaApplication.country,
        visaType: evaluation.visaApplication.visaType
      },
      documentCount: evaluation.documents.length,
      results: evaluation.results ? {
        score: evaluation.results.score,
        summary: evaluation.results.summary,
        recommendations: evaluation.results.recommendations,
        conclusion: evaluation.results.conclusion,
        evaluatedAt: evaluation.results.evaluatedAt,
        // Include structured fields if present
        criteriaAnalysis: evaluation.results.criteriaAnalysis,
        prioritizedRecommendations: evaluation.results.prioritizedRecommendations,
        scoreBreakdown: evaluation.results.scoreBreakdown,
        approvalLikelihood: evaluation.results.approvalLikelihood,
        validationResults: evaluation.results.validationResults
      } : undefined,
      createdAt: evaluation.createdAt
    }));

    // Return paginated response
    sendPaginated(
      res,
      evaluations,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total
    );

  } catch (error) {
    logger.error('Failed to list evaluations', {
      requestId: req.requestId,
      partnerId: req.partner?._id?.toString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
}

/**
 * Download evaluation report as Markdown
 * GET /api/evaluations/:id/download
 * 
 * Generates and downloads a Markdown report for the evaluation
 */
export async function downloadEvaluationPDF(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    logger.debug('Generating Markdown report for evaluation', {
      requestId: req.requestId,
      evaluationId: id
    });

    // Get evaluation service
    const evaluationService = getEvaluationService();

    // Fetch evaluation
    const evaluation = await evaluationService.getEvaluationById(id);

    // Generate Markdown
    const { MarkdownGenerator } = await import('../services/markdownGenerator');
    const markdownGenerator = new MarkdownGenerator();
    const markdownReport = markdownGenerator.generateEvaluationReport(evaluation);

    // Set response headers
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="visa-evaluation-${id}.md"`);

    // Send Markdown report
    res.send(markdownReport);

    logger.info('Markdown report generated and sent', {
      requestId: req.requestId,
      evaluationId: id,
      reportSize: markdownReport.length
    });

  } catch (error) {
    logger.error('Failed to generate Markdown report', {
      requestId: req.requestId,
      evaluationId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
}
