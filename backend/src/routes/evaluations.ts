import { Router } from 'express';
import {
  createEvaluation,
  getEvaluation,
  listEvaluations
} from '../controllers/evaluationController';
import { authenticatePartner } from '../middleware/auth';
import { uploadDocuments } from '../middleware/upload';
import {
  validateRequest,
  createEvaluationSchema,
  evaluationIdParamSchema,
  listEvaluationsQuerySchema,
  validateFileUpload
} from '../middleware/validation';
import { requestTimeout } from '../middleware/timeout';

const router = Router();

/**
 * POST /api/evaluations
 * Create a new visa evaluation
 * 
 * - Accepts multipart/form-data with documents
 * - Validates request body and file uploads
 * - 30-second timeout for processing
 * - Optional partner authentication (if x-api-key provided)
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.4, 8.5, 9.1
 */
router.post(
  '/',
  requestTimeout(30000), // 30-second timeout
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
 * 
 * Requirements: 4.3
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
 * 
 * Requirements: 4.3, 4.4, 4.5, 9.1
 */
router.get(
  '/',
  authenticatePartner, // Require partner authentication
  validateRequest(listEvaluationsQuerySchema, 'query'), // Validate query params
  listEvaluations
);

export default router;
