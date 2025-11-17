import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';

/**
 * Request logging middleware
 * Logs incoming requests with method, path, timestamp, and unique request ID
 * Logs response status code and duration when response completes
 * 
 * Requirements: 8.3
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate unique request ID for tracking
  const requestId = uuidv4();
  req.requestId = requestId;

  // Capture request start time
  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    logger.debug('Request query parameters', {
      requestId,
      query: req.query
    });
  }

  // Log request body if present (excluding sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = sanitizeBody(req.body);
    logger.debug('Request body', {
      requestId,
      body: sanitizedBody
    });
  }

  // Capture original end function
  const originalEnd = res.end;

  // Override res.end to log response
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    // Calculate request duration
    const duration = Date.now() - startTime;

    // Log response
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`
      });
    }

    // Call original end function
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
}

/**
 * Sanitize request body to remove sensitive information from logs
 * @param body - Request body object
 * @returns Sanitized body with sensitive fields masked
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password',
    'apiKey',
    'api_key',
    'token',
    'secret',
    'authorization',
    'creditCard',
    'ssn'
  ];

  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Error logging middleware
 * Logs errors that occur during request processing
 * Should be used after error handler to capture all errors
 */
export function errorLogger(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Request error', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  next(err);
}
