import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

/**
 * Extended Request interface with timeout support
 */
declare global {
  namespace Express {
    interface Request {
      timedOut?: boolean;
      abortController?: AbortController;
      timeoutSignal?: AbortSignal;
    }
  }
}

/**
 * Request timeout middleware with abort signal support
 * Sets a timeout limit for request processing and provides cancellation mechanism
 * Returns 408 Request Timeout if the limit is exceeded
 * 
 * Features:
 * - Sets timeout for request processing
 * - Provides AbortController for cancellable operations
 * - Marks request as timed out for downstream handlers
 * - Cleans up resources on completion
 * 
 * @param timeoutMs - Timeout duration in milliseconds
 * @returns Express middleware function
 */
export function requestTimeout(timeoutMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    let timedOut = false;

    // Create AbortController for cancellable operations
    const abortController = new AbortController();
    req.abortController = abortController;
    req.timeoutSignal = abortController.signal;

    // Set timeout on the request
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        timedOut = true;
        req.timedOut = true;

        logger.warn('Request timeout exceeded', {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          timeout: `${timeoutMs}ms`,
          userAgent: req.headers['user-agent']
        });

        // Abort any ongoing operations
        abortController.abort();

        res.status(HTTP_STATUS.REQUEST_TIMEOUT).json({
          status: 'error',
          message: `Request timeout: Processing exceeded ${timeoutMs / 1000} seconds`,
          code: ERROR_CODES.REQUEST_TIMEOUT,
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeoutId);
      if (!timedOut) {
        // Clean up abort controller if not already aborted
        abortController.abort();
      }
    });

    // Clear timeout on connection close
    res.on('close', () => {
      clearTimeout(timeoutId);
      if (!timedOut) {
        abortController.abort();
      }
    });

    next();
  };
}

/**
 * Check if request has timed out
 * Utility function for handlers to check timeout status
 * 
 * @param req - Express request object
 * @returns true if request has timed out
 */
export function isTimedOut(req: Request): boolean {
  return req.timedOut === true;
}

/**
 * Get abort signal from request
 * Returns the AbortSignal for cancellable operations
 * 
 * @param req - Express request object
 * @returns AbortSignal or undefined
 */
export function getAbortSignal(req: Request): AbortSignal | undefined {
  return req.timeoutSignal;
}
