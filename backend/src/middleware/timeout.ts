import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Request timeout middleware
 * Sets a timeout limit for request processing
 * Returns 408 Request Timeout if the limit is exceeded
 * 
 * Requirements: 8.4, 8.5
 * 
 * @param timeoutMs - Timeout duration in milliseconds
 * @returns Express middleware function
 */
export function requestTimeout(timeoutMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Set timeout on the request
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout exceeded', {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          timeout: `${timeoutMs}ms`
        });

        res.status(408).json({
          status: 'error',
          message: `Request timeout: Processing exceeded ${timeoutMs / 1000} seconds`
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    // Clear timeout on error
    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
}
