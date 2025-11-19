/**
 * Application-wide constants
 * Centralized location for magic numbers and configuration values
 */

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DOCUMENT_SIZE: 5 * 1024 * 1024, // 5MB
  TEXT_SAMPLE_SIZE: 8192, // 8KB for text file validation
  PDF_SCAN_SIZE: 50000 // 50KB for PDF security scanning
} as const;

/**
 * Request body size limits
 */
export const BODY_SIZE = {
  JSON_LIMIT: '10mb',
  URLENCODED_LIMIT: '10mb'
} as const;

/**
 * Timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  REQUEST_DEFAULT: 30000, // 30 seconds
  REQUEST_EXTENDED: 120000, // 2 minutes
  DATABASE_QUERY: 10000, // 10 seconds
  AI_API_CALL: 60000, // 60 seconds
  FILE_UPLOAD: 120000, // 2 minutes
  DOCUMENT_PARSING: 30000, // 30 seconds
  CLEANUP_INTERVAL: 30000 // 30 seconds
} as const;

/**
 * Rate limiting values
 */
export const RATE_LIMITS = {
  GENERAL_MAX: 100,
  GENERAL_WINDOW: 15 * 60 * 1000, // 15 minutes
  EVALUATION_MAX: 10,
  EVALUATION_WINDOW: 60 * 60 * 1000, // 1 hour
  PARTNER_MAX: 1000,
  PARTNER_WINDOW: 60 * 60 * 1000, // 1 hour
  PARTNER_EVAL_MAX: 50,
  PARTNER_EVAL_WINDOW: 60 * 60 * 1000, // 1 hour
  PUBLIC_READ_MAX: 200,
  PUBLIC_READ_WINDOW: 15 * 60 * 1000, // 15 minutes
  DOWNLOAD_MAX: 20,
  DOWNLOAD_WINDOW: 15 * 60 * 1000 // 15 minutes
} as const;

/**
 * Memory limits for rate limiter
 */
export const MEMORY_LIMITS = {
  MAX_STORE_SIZE: 10000, // Maximum number of keys in rate limiter
  MAX_REQUESTS_PER_KEY: 1000, // Maximum requests array size per key
  MEMORY_WARNING_THRESHOLD: 0.8 // Warn at 80% capacity
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

/**
 * Score limits
 */
export const SCORES = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  DEFAULT_SUCCESS_CAP: 85
} as const;

/**
 * Email validation
 */
export const EMAIL = {
  MAX_LENGTH: 254, // RFC 5321
  MAX_LOCAL_PART: 64,
  MAX_DOMAIN: 255
} as const;

/**
 * Text content limits
 */
export const TEXT_LIMITS = {
  NAME_MAX: 100,
  COUNTRY_MAX: 100,
  VISA_TYPE_MAX: 200,
  SUMMARY_MAX: 5000,
  DOCUMENT_TEXT_MAX: 10000,
  FILENAME_MAX: 50 // Maximum length for sanitized filename
} as const;

/**
 * HTTP methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS'
} as const;

/**
 * Allowed HTTP methods for CORS
 */
export const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

/**
 * Allowed headers for CORS
 */
export const CORS_HEADERS = ['Content-Type', 'Authorization', 'x-api-key'];

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_VALIDATION_ERROR: 'DATABASE_VALIDATION_ERROR',
  INVALID_ID_FORMAT: 'INVALID_ID_FORMAT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  TOO_MANY_FILES: 'TOO_MANY_FILES',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
  ADMIN_AUTH_REQUIRED: 'ADMIN_AUTH_REQUIRED',
  INVALID_ADMIN_KEY: 'INVALID_ADMIN_KEY',
  ADMIN_AUTH_NOT_CONFIGURED: 'ADMIN_AUTH_NOT_CONFIGURED'
} as const;

/**
 * Cache durations (in seconds)
 */
export const CACHE_DURATION = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  CORS_PREFLIGHT: 86400 // 24 hours for CORS preflight cache
} as const;

/**
 * Retry configuration
 */
export const RETRY = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 5000, // 5 seconds
  DB_MAX_ATTEMPTS: 5,
  DB_DELAY: 5000 // 5 seconds between DB connection retries
} as const;

/**
 * Database connection pool
 */
export const DB_POOL = {
  MAX_POOL_SIZE_PROD: 50,
  MAX_POOL_SIZE_DEV: 10,
  MIN_POOL_SIZE_PROD: 10,
  MIN_POOL_SIZE_DEV: 2,
  SOCKET_TIMEOUT: 45000,
  SERVER_SELECTION_TIMEOUT: 5000,
  CONNECT_TIMEOUT: 10000,
  HEARTBEAT_FREQUENCY: 10000,
  MAX_IDLE_TIME: 30000
} as const;

/**
 * Logging
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

/**
 * Log file rotation
 */
export const LOG_ROTATION = {
  MAX_FILES: 5, // Keep 5 rotated log files
  MAX_SIZE: 5 * 1024 * 1024 // 5MB per log file
} as const;

/**
 * File types
 */
export const ALLOWED_FILE_TYPES = {
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TXT: 'text/plain',
  JPEG: 'image/jpeg',
  PNG: 'image/png'
} as const;

export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png'
] as const;

/**
 * File upload limits
 */
export const UPLOAD_LIMITS = {
  MAX_FILES_PER_REQUEST: 10, // Maximum number of files per upload request
  BINARY_THRESHOLD: 0.05 // 5% threshold for binary content detection in text files
} as const;

/**
 * Database query thresholds
 */
export const DB_THRESHOLDS = {
  SLOW_QUERY_RATIO: 0.5 // Log queries that take more than 50% of timeout
} as const;
