import { Router } from 'express';
import {
  listVisaTypes,
  getVisaTypesByCountry
} from '../controllers/visaTypeController';
import { publicReadLimiter } from '../config/rateLimits';

const router = Router();

/**
 * Apply public read rate limiter to all visa type endpoints
 * Protects against abuse while allowing reasonable access
 * Default: 200 requests per 15 minutes per IP
 */
router.use(publicReadLimiter);

/**
 * GET /api/visa-types
 * List all available visa types
 * 
 * - Returns all visa types grouped by country
 * - No authentication required (public endpoint)
 * - Uses caching for performance
 */
router.get('/', listVisaTypes);

/**
 * GET /api/visa-types/:country
 * Get visa types for a specific country
 * 
 * - Returns visa types available for the specified country
 * - No authentication required (public endpoint)
 * - Uses caching for performance
 */
router.get('/:country', getVisaTypesByCountry);

export default router;
