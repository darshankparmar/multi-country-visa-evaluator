import { Request, Response, NextFunction } from 'express';
import { getConfig } from '../config/environment';
import { logger } from '../config/logger';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

/**
 * Administrator authentication middleware
 * Validates the x-admin-key header against the configured ADMIN_API_KEY
 * Used for sensitive endpoints like detailed health checks, metrics, etc.
 * 
 * Usage:
 * - Add to routes that should only be accessible by administrators
 * - Requires x-admin-key header with valid admin API key
 */
export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const config = getConfig();
  const adminKey = req.headers['x-admin-key'] as string;

  // Check if admin key is configured
  if (!config.ADMIN_API_KEY) {
    logger.warn('Admin authentication attempted but ADMIN_API_KEY not configured', {
      path: req.path,
      ip: req.ip
    });
    
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      status: 'error',
      message: 'Administrator authentication not configured',
      code: ERROR_CODES.ADMIN_AUTH_NOT_CONFIGURED
    });
    return;
  }

  // Check if admin key is provided
  if (!adminKey) {
    logger.warn('Admin authentication failed: No admin key provided', {
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: 'error',
      message: 'Administrator authentication required. Provide x-admin-key header.',
      code: ERROR_CODES.ADMIN_AUTH_REQUIRED
    });
    return;
  }

  // Validate admin key
  if (adminKey !== config.ADMIN_API_KEY) {
    logger.warn('Admin authentication failed: Invalid admin key', {
      path: req.path,
      ip: req.ip,
      providedKeyPrefix: adminKey.substring(0, 8) + '...',
      userAgent: req.headers['user-agent']
    });
    
    res.status(HTTP_STATUS.FORBIDDEN).json({
      status: 'error',
      message: 'Invalid administrator credentials',
      code: ERROR_CODES.INVALID_ADMIN_KEY
    });
    return;
  }

  // Authentication successful
  logger.info('Admin authentication successful', {
    path: req.path,
    ip: req.ip
  });

  next();
}

/**
 * Optional administrator authentication middleware
 * Allows access without admin key but provides enhanced data if authenticated
 * Sets req.isAdmin flag for conditional logic in route handlers
 */
export function optionalAdminAuth(req: Request, _res: Response, next: NextFunction): void {
  const config = getConfig();
  const adminKey = req.headers['x-admin-key'] as string;

  // Mark as not admin by default
  (req as any).isAdmin = false;

  // If no admin key configured or provided, continue without admin privileges
  if (!config.ADMIN_API_KEY || !adminKey) {
    return next();
  }

  // Validate admin key
  if (adminKey === config.ADMIN_API_KEY) {
    (req as any).isAdmin = true;
    logger.debug('Optional admin authentication successful', {
      path: req.path,
      ip: req.ip
    });
  } else {
    logger.debug('Optional admin authentication failed: Invalid key', {
      path: req.path,
      ip: req.ip
    });
  }

  next();
}
