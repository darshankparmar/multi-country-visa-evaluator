import { Router, Request, Response, NextFunction } from 'express';
import {
  createEvaluation,
  getEvaluation,
  listEvaluations,
  downloadEvaluationPDF
} from '../controllers/evaluationController';
import { authenticatePartner, optionalAuthentication } from '../middleware/auth';
import { uploadDocuments } from '../middleware/upload';
import {
  validateRequest,
  createEvaluationSchema,
  evaluationIdParamSchema,
  listEvaluationsQuerySchema,
  validateFileUpload
} from '../middleware/validation';
import {
  evaluationLimiter,
  partnerApiLimiter,
  partnerEvaluationLimiter,
  publicReadLimiter,
  downloadLimiter
} from '../config/rateLimits';

const router = Router();

/**
 * Conditional rate limiter for evaluation creation
 * Applies different rate limits based on authentication status:
 * - Partner authenticated: 50 evaluations/hour per API key
 * - Unauthenticated: 10 evaluations/hour per IP
 */
const evaluationRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Check if request has partner authentication (set by optionalAuthentication middleware)
  if (req.partner) {
    // Apply partner evaluation rate limiter
    return partnerEvaluationLimiter(req, res, next);
  } else {
    // Apply IP-based evaluation rate limiter
    return evaluationLimiter(req, res, next);
  }
};

/**
 * POST /api/evaluations
 * Create a new visa evaluation
 * 
 * - Accepts multipart/form-data with documents
 * - Validates request body and file uploads
 * - Global timeout applied (120s REQUEST_TIMEOUT_MS)
 * - Optional partner authentication (if x-api-key provided)
 * - If authenticated, evaluation is associated with the partner
 * - Rate limited: 10/hour for unauthenticated, 50/hour for partners
 * 
 * Timeout breakdown:
 * - Overall request: 120s (REQUEST_TIMEOUT_MS) - applied globally
 * - AI API call: 60s (AI_API_TIMEOUT_MS)
 * - Document parsing: 30s (PARSING_TIMEOUT)
 * - Database operations: 10s (DB_QUERY_TIMEOUT_MS)
 */
router.post(
  '/',
  optionalAuthentication, // Optional partner authentication (must run before rate limiter)
  evaluationRateLimiter, // Apply conditional rate limiting
  uploadDocuments, // Handle file uploads
  validateRequest(createEvaluationSchema, 'body'), // Validate body
  validateFileUpload(true, 1, 10), // Validate at least 1 file, max 10
  createEvaluation
);

/**
 * GET /api/evaluations/:id/download
 * Download evaluation report as Markdown
 * 
 * - Generates and downloads Markdown report
 * - No authentication required (public access by ID)
 * - Rate limited: 20 downloads per 15 minutes per IP
 */
router.get(
  '/:id/download',
  downloadLimiter, // Apply download rate limiter
  validateRequest(evaluationIdParamSchema, 'params'), // Validate UUID format
  downloadEvaluationPDF
);

/**
 * GET /api/evaluations/:id
 * Get evaluation by ID
 * 
 * - Returns complete evaluation details
 * - No authentication required (public access by ID)
 * - Rate limited: 200 requests per 15 minutes per IP
 */
router.get(
  '/:id',
  publicReadLimiter, // Apply public read rate limiter
  validateRequest(evaluationIdParamSchema, 'params'), // Validate UUID format
  getEvaluation
);

/**
 * GET /api/evaluations
 * List evaluations for authenticated partner
 * 
 * - Requires partner authentication via x-api-key header
 * - Returns only evaluations associated with the partner
 * - Supports pagination and filtering
 * - Rate limited: 1000 requests/hour per API key
 */
router.get(
  '/',
  authenticatePartner, // Require partner authentication
  partnerApiLimiter, // Apply partner API rate limiter
  validateRequest(listEvaluationsQuerySchema, 'query'), // Validate query params
  listEvaluations
);

export default router;
