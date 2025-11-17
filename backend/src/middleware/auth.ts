import { Request, Response, NextFunction } from 'express';
import { PartnerRepository } from '../repositories/partnerRepository';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../config/logger';

/**
 * Authentication middleware for partner API key validation
 * Extracts x-api-key from request headers and validates against active partners
 * Attaches partner object to req.partner if valid
 * 
 * Requirements: 4.1, 4.2, 10.5
 */
export async function authenticatePartner(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract API key from x-api-key header
    const apiKey = req.headers['x-api-key'] as string;

    // Check if API key is provided
    if (!apiKey) {
      logger.warn('Authentication failed: Missing API key', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      throw new AuthenticationError('API key is required. Please provide x-api-key header.');
    }

    // Query partner repository for matching active key
    const partnerRepository = new PartnerRepository();
    const partner = await partnerRepository.findByApiKey(apiKey);

    // Validate partner exists and is active
    if (!partner) {
      logger.warn('Authentication failed: Invalid API key', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      throw new AuthenticationError('Invalid API key');
    }

    if (!partner.active) {
      logger.warn('Authentication failed: Inactive partner', {
        partnerId: partner._id,
        partnerName: partner.name,
        path: req.path,
        method: req.method
      });
      throw new AuthenticationError('API key is inactive. Please contact support.');
    }

    // Attach partner to request object for use in controllers
    req.partner = partner;

    logger.debug('Partner authenticated successfully', {
      partnerId: partner._id,
      partnerName: partner.name,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attempts to authenticate partner but doesn't fail if no API key provided
 * Useful for endpoints that work differently for authenticated vs unauthenticated requests
 */
export async function optionalAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
      const partnerRepository = new PartnerRepository();
      const partner = await partnerRepository.findByApiKey(apiKey);

      if (partner && partner.active) {
        req.partner = partner;
        logger.debug('Optional authentication: Partner authenticated', {
          partnerId: partner._id,
          partnerName: partner.name
        });
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional authentication errors
    logger.debug('Optional authentication: Failed silently', { error });
    next();
  }
}
