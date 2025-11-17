import { Router } from 'express';
import {
  createEvaluation,
  getEvaluation,
  listEvaluations
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
import { requestTimeout } from '../middleware/timeout';
import { getConfig } from '../config/environment';

const router = Router();

/**
 * POST /api/evaluations
 * Create a new visa evaluation
 * 
 * - Accepts multipart/form-data with documents
 * - Validates request body and file uploads
 * - 30-second timeout for processing
 * - Optional partner authentication (if x-api-key provided)
 * - If authenticated, evaluation is associated with the partner
 * 
 * Note: Using middleware wrapper to support hot-reload in development
 */
router.post(
  '/',
  (req, res, next) => requestTimeout(getConfig().REQUEST_TIMEOUT_MS)(req, res, next),
  optionalAuthentication, // Optional partner authentication
  uploadDocuments, // Handle file uploads
  validateRequest(createEvaluationSchema, 'body'), // Validate body
  validateFileUpload(true, 1, 10), // Validate at least 1 file, max 10
  createEvaluation
);

/**
 * GET /api/evaluations/:id
 * Get evaluation by ID
 * 
 * - Returns complete evaluation details
 * - No authentication required (public access by ID)
 */
router.get(
  '/:id',
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
 */
router.get(
  '/',
  authenticatePartner, // Require partner authentication
  validateRequest(listEvaluationsQuerySchema, 'query'), // Validate query params
  listEvaluations
);

export default router;
