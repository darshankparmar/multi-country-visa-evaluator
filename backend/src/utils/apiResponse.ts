import { Response } from 'express';

/**
 * Standard success response structure
 */
export interface SuccessResponse<T = any> {
  status: 'success';
  data: T;
  message?: string;
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
  stack?: string;
  timestamp?: string;
  requestId?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T = any> {
  status: 'success';
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Send a success response
 * @param res - Express response object
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @param message - Optional success message
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): void {
  const response: SuccessResponse<T> = {
    status: 'success',
    data
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
}

/**
 * Send an error response with standardized format
 * @param res - Express response object
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @param code - Error code for client-side handling
 * @param errors - Optional array of detailed errors
 * @param stack - Optional stack trace (only in development)
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  errors?: Array<{ field?: string; message: string }>,
  stack?: string
): void {
  const response: ErrorResponse = {
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  };

  // Add error code if provided
  if (code) {
    response.code = code;
  } else {
    // Generate default error code from status code
    response.code = getDefaultErrorCode(statusCode);
  }

  // Add request ID if available
  if ((res as any).locals?.requestId) {
    response.requestId = (res as any).locals.requestId;
  }

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  // Only include stack trace in development
  if (stack && process.env.NODE_ENV === 'development') {
    response.stack = stack;
  }

  res.status(statusCode).json(response);
}

/**
 * Generate default error code from HTTP status code
 */
function getDefaultErrorCode(statusCode: number): string {
  const codes: { [key: number]: string } = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    408: 'REQUEST_TIMEOUT',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT'
  };
  return codes[statusCode] || 'ERROR';
}

/**
 * Send a paginated response
 * @param res - Express response object
 * @param data - Array of data items
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  statusCode: number = 200
): void {
  const totalPages = Math.ceil(total / limit);

  const response: PaginatedResponse<T> = {
    status: 'success',
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };

  res.status(statusCode).json(response);
}

/**
 * Send a created response (201)
 * @param res - Express response object
 * @param data - Created resource data
 * @param message - Optional success message
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string
): void {
  sendSuccess(res, data, 201, message);
}

/**
 * Send a no content response (204)
 * @param res - Express response object
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/**
 * Send a validation error response (400)
 * @param res - Express response object
 * @param message - Validation error message
 * @param errors - Array of field-specific validation errors
 */
export function sendValidationError(
  res: Response,
  message: string = 'Validation failed',
  errors?: Array<{ field?: string; message: string }>
): void {
  sendError(res, message, 400, 'VALIDATION_ERROR', errors);
}

/**
 * Send an unauthorized error response (401)
 * @param res - Express response object
 * @param message - Authentication error message
 */
export function sendUnauthorized(
  res: Response,
  message: string = 'Authentication required'
): void {
  sendError(res, message, 401, 'UNAUTHORIZED');
}

/**
 * Send a forbidden error response (403)
 * @param res - Express response object
 * @param message - Authorization error message
 */
export function sendForbidden(
  res: Response,
  message: string = 'Access forbidden'
): void {
  sendError(res, message, 403, 'FORBIDDEN');
}

/**
 * Send a not found error response (404)
 * @param res - Express response object
 * @param resource - Name of the resource that wasn't found
 */
export function sendNotFound(
  res: Response,
  resource: string = 'Resource'
): void {
  sendError(res, `${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Send a conflict error response (409)
 * @param res - Express response object
 * @param message - Conflict error message
 */
export function sendConflict(
  res: Response,
  message: string
): void {
  sendError(res, message, 409, 'CONFLICT');
}

/**
 * Send an internal server error response (500)
 * @param res - Express response object
 * @param message - Error message
 * @param stack - Optional stack trace
 */
export function sendInternalError(
  res: Response,
  message: string = 'Internal server error',
  stack?: string
): void {
  sendError(res, message, 500, 'INTERNAL_SERVER_ERROR', undefined, stack);
}
