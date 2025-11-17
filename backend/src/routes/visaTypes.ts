import { Router } from 'express';
import {
  listVisaTypes,
  getVisaTypesByCountry
} from '../controllers/visaTypeController';

const router = Router();

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
