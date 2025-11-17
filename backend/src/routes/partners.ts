import { Router } from 'express';
import {
  createPartner,
  listPartners,
  updatePartnerStatus
} from '../controllers/partnerController';
import {
  validateRequest,
  createPartnerSchema,
  updatePartnerStatusSchema,
  objectIdParamSchema
} from '../middleware/validation';

const router = Router();

/**
 * POST /api/partners
 * Create a new partner with generated API key
 * 
 * - Admin only endpoint (future: add admin authentication)
 * - Validates partner data
 * - Generates cryptographically secure API key
 * - Returns partner details including API key
 */
router.post(
  '/',
  validateRequest(createPartnerSchema, 'body'),
  createPartner
);

/**
 * GET /api/partners
 * List all partners
 * 
 * - Admin only endpoint (future: add admin authentication)
 * - Returns all partners with their details
 * - No pagination (admin view)
 */
router.get(
  '/',
  listPartners
);

/**
 * PATCH /api/partners/:id/status
 * Update partner active status
 * 
 * - Admin only endpoint (future: add admin authentication)
 * - Activates or deactivates a partner
 * - Deactivated partners cannot authenticate
 */
router.patch(
  '/:id/status',
  validateRequest(objectIdParamSchema, 'params'),
  validateRequest(updatePartnerStatusSchema, 'body'),
  updatePartnerStatus
);

export default router;
