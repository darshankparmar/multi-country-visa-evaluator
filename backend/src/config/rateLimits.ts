/**
 * Rate Limit Configuration
 * Defines rate limiting rules for different API endpoints
 */

import { Request } from 'express';
import { createRateLimiter } from '../middleware/rateLimiter';
import { getConfig } from './environment';
import { logger } from './logger';

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Get API key from request headers
 */
function getApiKey(req: Request): string {
  return (req.headers['x-api-key'] as string) || '';
}

// Lazy-loaded rate limiters
let _generalApiLimiter: ReturnType<typeof createRateLimiter> | null = null;
let _evaluationLimiter: ReturnType<typeof createRateLimiter> | null = null;
let _partnerApiLimiter: ReturnType<typeof createRateLimiter> | null = null;
let _partnerEvaluationLimiter: ReturnType<typeof createRateLimiter> | null = null;
let _publicReadLimiter: ReturnType<typeof createRateLimiter> | null = null;
let _downloadLimiter: ReturnType<typeof createRateLimiter> | null = null;

/**
 * Initialize rate limiters with configuration from environment
 * Must be called after environment variables are loaded
 */
export function initializeRateLimiters() {
  const config = getConfig();

  // Create rate limiters
  _generalApiLimiter = createRateLimiter({
    windowMs: config.RATE_LIMIT_GENERAL_WINDOW_MS,
    max: config.RATE_LIMIT_GENERAL_MAX,
    keyGenerator: (req: Request) => `general:${getClientIp(req)}`,
    skip: (req: Request) => {
      // Skip health check endpoints
      return req.path === '/health' || req.path === '/api/health';
    },
    message: 'Too many requests from this IP, please try again later'
  });

  _evaluationLimiter = createRateLimiter({
    windowMs: config.RATE_LIMIT_EVALUATION_WINDOW_MS,
    max: config.RATE_LIMIT_EVALUATION_MAX,
    keyGenerator: (req: Request) => `evaluation:${getClientIp(req)}`,
    message: 'Too many evaluation requests from this IP, please try again later'
  });

  _partnerApiLimiter = createRateLimiter({
    windowMs: config.RATE_LIMIT_PARTNER_WINDOW_MS,
    max: config.RATE_LIMIT_PARTNER_MAX,
    keyGenerator: (req: Request) => {
      const apiKey = getApiKey(req);
      // Fall back to IP if no API key
      return apiKey ? `partner:${apiKey}` : `partner-ip:${getClientIp(req)}`;
    },
    message: 'Too many requests for this API key, please try again later'
  });

  _partnerEvaluationLimiter = createRateLimiter({
    windowMs: config.RATE_LIMIT_PARTNER_EVAL_WINDOW_MS,
    max: config.RATE_LIMIT_PARTNER_EVAL_MAX,
    keyGenerator: (req: Request) => {
      const apiKey = getApiKey(req);
      // Fall back to IP if no API key
      return apiKey ? `partner-eval:${apiKey}` : `partner-eval-ip:${getClientIp(req)}`;
    },
    message: 'Too many evaluation requests for this API key, please try again later'
  });

  _publicReadLimiter = createRateLimiter({
    windowMs: config.RATE_LIMIT_PUBLIC_READ_WINDOW_MS,
    max: config.RATE_LIMIT_PUBLIC_READ_MAX,
    keyGenerator: (req: Request) => `public-read:${getClientIp(req)}`,
    message: 'Too many requests from this IP, please try again later'
  });

  _downloadLimiter = createRateLimiter({
    windowMs: config.RATE_LIMIT_DOWNLOAD_WINDOW_MS,
    max: config.RATE_LIMIT_DOWNLOAD_MAX,
    keyGenerator: (req: Request) => `download:${getClientIp(req)}`,
    message: 'Too many download requests from this IP, please try again later'
  });

  // Log rate limit configuration on startup with detailed information
  logger.info('Rate limit configuration initialized', {
    generalApi: {
      max: config.RATE_LIMIT_GENERAL_MAX,
      windowMs: config.RATE_LIMIT_GENERAL_WINDOW_MS,
      windowMinutes: config.RATE_LIMIT_GENERAL_WINDOW_MS / 60000,
      description: 'IP-based rate limit for all API endpoints'
    },
    evaluation: {
      max: config.RATE_LIMIT_EVALUATION_MAX,
      windowMs: config.RATE_LIMIT_EVALUATION_WINDOW_MS,
      windowHours: config.RATE_LIMIT_EVALUATION_WINDOW_MS / 3600000,
      description: 'IP-based rate limit for unauthenticated evaluation submissions'
    },
    partnerApi: {
      max: config.RATE_LIMIT_PARTNER_MAX,
      windowMs: config.RATE_LIMIT_PARTNER_WINDOW_MS,
      windowHours: config.RATE_LIMIT_PARTNER_WINDOW_MS / 3600000,
      description: 'API key-based rate limit for partner API requests'
    },
    partnerEvaluation: {
      max: config.RATE_LIMIT_PARTNER_EVAL_MAX,
      windowMs: config.RATE_LIMIT_PARTNER_EVAL_WINDOW_MS,
      windowHours: config.RATE_LIMIT_PARTNER_EVAL_WINDOW_MS / 3600000,
      description: 'API key-based rate limit for partner evaluation submissions'
    },
    publicRead: {
      max: config.RATE_LIMIT_PUBLIC_READ_MAX,
      windowMs: config.RATE_LIMIT_PUBLIC_READ_WINDOW_MS,
      windowMinutes: config.RATE_LIMIT_PUBLIC_READ_WINDOW_MS / 60000,
      description: 'IP-based rate limit for public read endpoints (visa types, evaluation details)'
    },
    download: {
      max: config.RATE_LIMIT_DOWNLOAD_MAX,
      windowMs: config.RATE_LIMIT_DOWNLOAD_WINDOW_MS,
      windowMinutes: config.RATE_LIMIT_DOWNLOAD_WINDOW_MS / 60000,
      description: 'IP-based rate limit for evaluation report downloads'
    },
    timestamp: new Date().toISOString()
  });

  logger.info('Rate limiting active for all API endpoints');
}

/**
 * General API rate limiter (IP-based)
 * Applied to all /api/* routes
 * Default: 100 requests per 15 minutes per IP
 */
export const generalApiLimiter: ReturnType<typeof createRateLimiter> = (req, res, next) => {
  if (!_generalApiLimiter) {
    throw new Error('Rate limiters not initialized. Call initializeRateLimiters() first.');
  }
  return _generalApiLimiter(req, res, next);
};

/**
 * Evaluation endpoint rate limiter (IP-based)
 * Applied to POST /api/evaluations for unauthenticated requests
 * Default: 10 evaluations per hour per IP
 */
export const evaluationLimiter: ReturnType<typeof createRateLimiter> = (req, res, next) => {
  if (!_evaluationLimiter) {
    throw new Error('Rate limiters not initialized. Call initializeRateLimiters() first.');
  }
  return _evaluationLimiter(req, res, next);
};

/**
 * Partner API rate limiter (API key-based)
 * Applied to all partner-authenticated routes
 * Default: 1000 requests per hour per API key
 */
export const partnerApiLimiter: ReturnType<typeof createRateLimiter> = (req, res, next) => {
  if (!_partnerApiLimiter) {
    throw new Error('Rate limiters not initialized. Call initializeRateLimiters() first.');
  }
  return _partnerApiLimiter(req, res, next);
};

/**
 * Partner evaluation rate limiter (API key-based)
 * Applied to POST /api/evaluations for partner requests
 * Default: 50 evaluations per hour per API key
 */
export const partnerEvaluationLimiter: ReturnType<typeof createRateLimiter> = (req, res, next) => {
  if (!_partnerEvaluationLimiter) {
    throw new Error('Rate limiters not initialized. Call initializeRateLimiters() first.');
  }
  return _partnerEvaluationLimiter(req, res, next);
};

/**
 * Public read endpoint rate limiter (IP-based)
 * Applied to public GET endpoints like visa types and evaluation details
 * Default: 200 requests per 15 minutes per IP
 */
export const publicReadLimiter: ReturnType<typeof createRateLimiter> = (req, res, next) => {
  if (!_publicReadLimiter) {
    throw new Error('Rate limiters not initialized. Call initializeRateLimiters() first.');
  }
  return _publicReadLimiter(req, res, next);
};

/**
 * Download rate limiter (IP-based)
 * Applied to evaluation report download endpoints
 * Default: 20 downloads per 15 minutes per IP
 */
export const downloadLimiter: ReturnType<typeof createRateLimiter> = (req, res, next) => {
  if (!_downloadLimiter) {
    throw new Error('Rate limiters not initialized. Call initializeRateLimiters() first.');
  }
  return _downloadLimiter(req, res, next);
};
