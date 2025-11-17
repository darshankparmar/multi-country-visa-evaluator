import { Request, Response, NextFunction } from 'express';
import { VisaTypeRepository } from '../repositories/visaTypeRepository';
import { VisaTypeResponse } from '../types/visaType.types';
import { sendSuccess } from '../utils/apiResponse';
import { logger } from '../config/logger';

/**
 * Initialize visa type repository
 */
function getVisaTypeRepository(): VisaTypeRepository {
  return new VisaTypeRepository();
}

/**
 * List all visa types
 * GET /api/visa-types
 * 
 * Returns all available visa types grouped by country
 * Uses cached results when available for performance
 * No authentication required - public endpoint
 * 
 * Requirements: 3.1, 3.2, 3.3
 */
export async function listVisaTypes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.debug('Fetching all visa types', {
      requestId: req.requestId
    });

    // Get visa type repository
    const visaTypeRepository = getVisaTypeRepository();

    // Fetch all active visa types (uses cache if available)
    const visaTypes = await visaTypeRepository.findAll(true);

    logger.info('Visa types retrieved successfully', {
      requestId: req.requestId,
      count: visaTypes.length,
      cached: visaTypeRepository.getCacheStats().isPopulated
    });

    // Map to response format
    const response: VisaTypeResponse[] = visaTypes.map(vt => ({
      id: (vt._id as any).toString(),
      country: vt.country,
      visaType: vt.visaType,
      requiredDocuments: vt.requiredDocuments,
      description: vt.description,
      processingTime: vt.processingTime,
      active: vt.active
    }));

    // Return success response
    sendSuccess(res, response);

  } catch (error) {
    logger.error('Failed to fetch visa types', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
}

/**
 * Get visa types by country
 * GET /api/visa-types/:country
 * 
 * Returns all visa types available for a specific country
 * Uses cached results when available for performance
 * No authentication required - public endpoint
 * 
 * Requirements: 3.1, 3.2, 3.3
 */
export async function getVisaTypesByCountry(
  req: Request<{ country: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { country } = req.params;

    logger.debug('Fetching visa types by country', {
      requestId: req.requestId,
      country
    });

    // Get visa type repository
    const visaTypeRepository = getVisaTypeRepository();

    // Fetch visa types for the country (uses cache if available)
    const visaTypes = await visaTypeRepository.findByCountry(country, true);

    logger.info('Visa types by country retrieved successfully', {
      requestId: req.requestId,
      country,
      count: visaTypes.length,
      cached: visaTypeRepository.getCacheStats().isPopulated
    });

    // Map to response format
    const response: VisaTypeResponse[] = visaTypes.map(vt => ({
      id: (vt._id as any).toString(),
      country: vt.country,
      visaType: vt.visaType,
      requiredDocuments: vt.requiredDocuments,
      description: vt.description,
      processingTime: vt.processingTime,
      active: vt.active
    }));

    // Return success response
    sendSuccess(res, response);

  } catch (error) {
    logger.error('Failed to fetch visa types by country', {
      requestId: req.requestId,
      country: req.params.country,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
}
