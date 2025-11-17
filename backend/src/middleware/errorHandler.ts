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
 * Requirements: 8.1, 8.2, 9.4
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
  next: NextFunction
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

    return sendError(
      res,
      'Validation failed',
      400,
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

    return sendError(
      res,
      'Database validation failed',
      400,
      errors,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle Mongoose cast errors (invalid ObjectId, etc.)
  if (err instanceof mongoose.Error.CastError) {
    return sendError(
      res,
      `Invalid ${err.path}: ${err.value}`,
      400,
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern || {})[0] || 'field';
    return sendError(
      res,
      `Duplicate value for ${field}. This ${field} already exists.`,
      409,
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle JWT errors (if using JWT in the future)
  if (err.name === 'JsonWebTokenError') {
    return sendError(
      res,
      'Invalid token',
      401,
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(
      res,
      'Token expired',
      401,
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle Multer file upload errors
  if (err.name === 'MulterError') {
    const multerErr = err as any;
    let message = 'File upload error';

    switch (multerErr.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the maximum allowed limit';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field in file upload';
        break;
      default:
        message = multerErr.message || 'File upload error';
    }

    return sendError(
      res,
      message,
      400,
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle unknown/programming errors
  logger.error('Unhandled error - this should not happen', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    name: err.name
  });

  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  return sendError(
    res,
    message,
    500,
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
    url: req.url
  });

  sendError(
    res,
    `Cannot ${req.method} ${req.path}`,
    404
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
