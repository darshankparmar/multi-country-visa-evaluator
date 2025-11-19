import { HTTP_STATUS } from '../constants';

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  /**
   * Creates an application error
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param isOperational - Whether this is an operational error (true) or programming error (false)
   */
  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly to maintain instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error - 400 Bad Request
 * Used when request data fails validation
 */
export class ValidationError extends AppError {
  /**
   * Creates a validation error
   * @param message - Validation error message
   */
  constructor(message: string) {
    super(message, HTTP_STATUS.BAD_REQUEST, true);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication error - 401 Unauthorized
 * Used when authentication fails or is missing
 */
export class AuthenticationError extends AppError {
  /**
   * Creates an authentication error
   * @param message - Authentication error message (default: 'Unauthorized')
   */
  constructor(message: string = 'Unauthorized') {
    super(message, HTTP_STATUS.UNAUTHORIZED, true);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error - 403 Forbidden
 * Used when user is authenticated but lacks permissions
 */
export class AuthorizationError extends AppError {
  /**
   * Creates an authorization error
   * @param message - Authorization error message (default: 'Forbidden')
   */
  constructor(message: string = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN, true);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found error - 404 Not Found
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  /**
   * Creates a not found error
   * @param resource - Name of the resource that wasn't found
   */
  constructor(resource: string) {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND, true);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error - 409 Conflict
 * Used when a request conflicts with current state (e.g., duplicate resource)
 */
export class ConflictError extends AppError {
  /**
   * Creates a conflict error
   * @param message - Conflict error message
   */
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT, true);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Internal server error - 500 Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  /**
   * Creates an internal server error
   * @param message - Error message (default: 'Internal server error')
   */
  constructor(message: string = 'Internal server error') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, false);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Request timeout error - 408 Request Timeout
 * Used when a request takes too long to process
 */
export class TimeoutError extends AppError {
  /**
   * Creates a timeout error
   * @param message - Timeout error message (default: 'Request timeout')
   */
  constructor(message: string = 'Request timeout') {
    super(message, HTTP_STATUS.REQUEST_TIMEOUT, true);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}
