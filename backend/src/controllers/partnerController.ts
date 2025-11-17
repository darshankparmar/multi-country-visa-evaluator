import { Request, Response, NextFunction } from 'express';
import { PartnerRepository } from '../repositories/partnerRepository';
import { CreatePartnerRequest, PartnerResponse, UpdatePartnerStatusRequest } from '../types/partner.types';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { NotFoundError, ConflictError } from '../utils/errors';
import { logger } from '../config/logger';
import crypto from 'crypto';

// Initialize repository
const partnerRepository = new PartnerRepository();

/**
 * Generate a cryptographically secure API key
 * Requirements: 10.2
 * 
 * @returns Secure random API key string
 */
function generateApiKey(): string {
  const keyLength = Number(process.env.API_KEY_LENGTH) || 32;
  return crypto.randomBytes(keyLength).toString('hex');
}

/**
 * Transform IPartner document to PartnerResponse DTO
 * 
 * @param partner - Partner document from database
 * @returns Partner response object
 */
function toPartnerResponse(partner: any): PartnerResponse {
  return {
    id: partner._id.toString(),
    name: partner.name,
    email: partner.email,
    apiKey: partner.apiKey,
    contactInfo: partner.contactInfo,
    active: partner.active,
    createdAt: partner.createdAt
  };
}

/**
 * POST /api/partners
 * Create a new partner with generated API key
 * 
 * Requirements: 10.1, 10.2, 10.3
 * 
 * @param req - Express request with CreatePartnerRequest body
 * @param res - Express response
 * @param next - Express next function
 */
export async function createPartner(
  req: Request<{}, {}, CreatePartnerRequest>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, contactInfo } = req.body;

    logger.info('Creating new partner', { name, email });

    // Check if partner with email already exists
    const existingPartner = await partnerRepository.findByEmail(email);
    if (existingPartner) {
      logger.warn('Partner creation failed: email already exists', { email });
      throw new ConflictError('Partner with this email already exists');
    }

    // Generate cryptographically secure API key
    const apiKey = generateApiKey();

    // Create partner record
    const partner = await partnerRepository.create({
      name,
      email: email.toLowerCase(),
      apiKey,
      contactInfo,
      active: true
    });

    logger.info('Partner created successfully', {
      partnerId: partner._id.toString(),
      name: partner.name,
      email: partner.email
    });

    // Return partner response with API key
    const response = toPartnerResponse(partner);
    sendCreated(res, response, 'Partner created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/partners
 * List all partners
 * 
 * Requirements: 10.3, 10.4
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export async function listPartners(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.info('Listing all partners');

    // Get all partners (no pagination for admin view)
    const partners = await partnerRepository.list();

    logger.info('Partners retrieved successfully', { count: partners.length });

    // Transform to response DTOs
    const response = partners.map(toPartnerResponse);

    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/partners/:id/status
 * Update partner active status
 * 
 * Requirements: 10.4, 10.5
 * 
 * @param req - Express request with partner ID param and UpdatePartnerStatusRequest body
 * @param res - Express response
 * @param next - Express next function
 */
export async function updatePartnerStatus(
  req: Request<{ id: string }, {}, UpdatePartnerStatusRequest>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { active } = req.body;

    logger.info('Updating partner status', { partnerId: id, active });

    // Update partner status
    const partner = await partnerRepository.updateStatus(id, active);

    if (!partner) {
      logger.warn('Partner not found for status update', { partnerId: id });
      throw new NotFoundError('Partner');
    }

    logger.info('Partner status updated successfully', {
      partnerId: partner._id.toString(),
      active: partner.active
    });

    // Return updated partner
    const response = toPartnerResponse(partner);
    sendSuccess(res, response, 200, 'Partner status updated successfully');
  } catch (error) {
    next(error);
  }
}
