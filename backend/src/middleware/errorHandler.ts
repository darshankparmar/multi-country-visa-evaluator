import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/apiResponse';
import { logger } from '../config/logger';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 * Logs errors with context and returns standardized error responses
 * 
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error with full context
  logger.error('Error occurred during request processing', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    url: req.url,
    error: err.message,
    stack: err.stack,
    name: err.name,
    timestamp: new Date().toISOString()
  });

  // Handle operational errors (AppError instances)
  if (err instanceof AppError && err.isOperational) {
    return sendError(
      res,
      err.message,
      err.statusCode,
      err.name.toUpperCase().replace(/\s+/g, '_'),
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message
    }));

    logger.warn('Validation error', {
      requestId: req.requestId,
      errors
    });

    return sendError(
      res,
      'Request validation failed',
      400,
      'VALIDATION_ERROR',
      errors,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message
    }));

    logger.warn('Database validation error', {
      requestId: req.requestId,
      errors
    });

    return sendError(
      res,
      'Data validation failed',
      400,
      'DATABASE_VALIDATION_ERROR',
      errors,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle Mongoose cast errors (invalid ObjectId, etc.)
  if (err instanceof mongoose.Error.CastError) {
    logger.warn('Database cast error', {
      requestId: req.requestId,
      path: err.path,
      value: err.value
    });

    return sendError(
      res,
      `Invalid ${err.path}: ${err.value}`,
      400,
      'INVALID_ID_FORMAT',
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern || {})[0] || 'field';
    
    logger.warn('Duplicate key error', {
      requestId: req.requestId,
      field
    });

    return sendError(
      res,
      `Duplicate value for ${field}. This ${field} already exists.`,
      409,
      'DUPLICATE_ENTRY',
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle JWT errors (if using JWT in the future)
  if (err.name === 'JsonWebTokenError') {
    logger.warn('JWT validation error', {
      requestId: req.requestId
    });

    return sendError(
      res,
      'Invalid authentication token',
      401,
      'INVALID_TOKEN',
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn('JWT expiration error', {
      requestId: req.requestId
    });

    return sendError(
      res,
      'Authentication token has expired',
      401,
      'TOKEN_EXPIRED',
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle Multer file upload errors
  if (err.name === 'MulterError') {
    const multerErr = err as any;
    let message = 'File upload error';
    let code = 'FILE_UPLOAD_ERROR';

    switch (multerErr.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the maximum allowed limit';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field in file upload';
        code = 'UNEXPECTED_FILE_FIELD';
        break;
      default:
        message = multerErr.message || 'File upload error';
    }

    logger.warn('File upload error', {
      requestId: req.requestId,
      code: multerErr.code,
      message
    });

    return sendError(
      res,
      message,
      400,
      code,
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle unknown/programming errors
  logger.error('Unhandled error - this should not happen', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    name: err.name,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal server error';

  return sendError(
    res,
    message,
    500,
    'INTERNAL_SERVER_ERROR',
    undefined,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
}

/**
 * Handle 404 Not Found errors for undefined routes
 * Should be registered after all other routes
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  sendError(
    res,
    `Route not found: ${req.method} ${req.path}`,
    404,
    'ROUTE_NOT_FOUND'
  );
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass them to error handler
 * 
 * @param fn - Async route handler function
 * @returns Wrapped function that catches errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
