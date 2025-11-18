/**
 * Rate Limiter Middleware
 * Provides configurable rate limiting for API endpoints
 * 
 * Rate Limit Response Format (HTTP 429):
 * {
 *   status: 'error',
 *   message: 'Too many requests, please try again later',
 *   details: 'Your [IP address/API key] has exceeded the rate limit of X requests. Please wait Y seconds before retrying.',
 *   code: 'RATE_LIMIT_EXCEEDED',
 *   retryAfter: 3600,  // seconds until rate limit resets
 *   limit: 100,  // maximum requests allowed
 *   resetTime: '2025-11-18T12:00:00.000Z',  // ISO timestamp when limit resets
 *   rateLimitType: 'ip-address' | 'api-key'  // type of rate limiting applied
 * }
 * 
 * Rate Limit Headers (included in all responses):
 * - X-RateLimit-Limit: Maximum requests allowed in the window
 * - X-RateLimit-Remaining: Requests remaining in current window
 * - X-RateLimit-Reset: ISO timestamp when the rate limit resets
 * - Retry-After: Seconds to wait before retrying (only on 429 responses)
 */

import { Request, Response, NextFunction } from 'express';
import { InMemoryRateLimitStore } from './rateLimitStore';
import { logger } from '../config/logger';

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  max: number;             // Maximum requests per window
  keyGenerator: (req: Request) => string;  // Generate unique key (IP or API key)
  handler?: (req: Request, res: Response) => void;  // Custom handler for limit exceeded
  skip?: (req: Request) => boolean;  // Skip rate limiting for certain requests
  message?: string;        // Custom error message
}

/**
 * Create a rate limiter middleware with the specified configuration
 * @param config - Rate limit configuration
 * @returns Express middleware function
 */
export function createRateLimiter(config: RateLimitConfig) {
  const store = new InMemoryRateLimitStore(config.windowMs, config.max);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if configured
      if (config.skip && config.skip(req)) {
        return next();
      }

      const key = config.keyGenerator(req);
      
      // If no key can be generated, skip rate limiting
      if (!key) {
        logger.warn('Rate limiter: Unable to generate key, skipping rate limit');
        return next();
      }

      const limitInfo = await store.increment(key);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limitInfo.limit.toString());
      res.setHeader('X-RateLimit-Remaining', limitInfo.remaining.toString());
      res.setHeader('X-RateLimit-Reset', limitInfo.reset.toISOString());

      // Log rate limit metrics for monitoring
      logger.debug('Rate limit check', {
        key,
        endpoint: req.path,
        method: req.method,
        limit: limitInfo.limit,
        remaining: limitInfo.remaining,
        reset: limitInfo.reset.toISOString()
      });

      // Check if limit exceeded
      if (limitInfo.remaining === 0) {
        const retryAfter = Math.ceil((limitInfo.reset.getTime() - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());

        // Determine client identifier (IP or API key)
        const apiKey = req.headers['x-api-key'] as string;
        const clientIdentifier = apiKey ? `API Key: ${apiKey.substring(0, 8)}...` : `IP: ${req.ip}`;
        const isApiKeyBased = !!apiKey;

        // Log rate limit violation with detailed information
        logger.warn('Rate limit exceeded', {
          clientIdentifier,
          apiKey: apiKey ? apiKey.substring(0, 8) + '...' : undefined,
          ip: req.ip,
          endpoint: req.path,
          method: req.method,
          userAgent: req.headers['user-agent'],
          limit: limitInfo.limit,
          retryAfter,
          resetTime: limitInfo.reset.toISOString(),
          timestamp: new Date().toISOString()
        });

        // Use custom handler if provided
        if (config.handler) {
          return config.handler(req, res);
        }

        // Create differentiated error messages
        let message = config.message || 'Too many requests, please try again later';
        let details = '';

        if (isApiKeyBased) {
          // API key-based rate limit message
          details = `Your API key has exceeded the rate limit of ${limitInfo.limit} requests. Please wait ${retryAfter} seconds before retrying.`;
        } else {
          // IP-based rate limit message
          details = `Your IP address has exceeded the rate limit of ${limitInfo.limit} requests. Please wait ${retryAfter} seconds before retrying.`;
        }

        // Enhanced 429 response with clear retry information
        return res.status(429).json({
          status: 'error',
          message,
          details,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
          limit: limitInfo.limit,
          resetTime: limitInfo.reset.toISOString(),
          rateLimitType: isApiKeyBased ? 'api-key' : 'ip-address'
        });
      }

      next();
    } catch (error) {
      // Log error but don't block the request
      logger.error('Rate limiter error', { error });
      next();
    }
  };
}
