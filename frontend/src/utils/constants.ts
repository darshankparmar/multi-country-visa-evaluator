/**
 * Application constants
 */

/**
 * API configuration
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000, // 30 seconds
} as const

/**
 * File upload constraints
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
} as const

/**
 * Form validation rules
 */
export const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_DOCUMENTS: 1,
  MAX_DOCUMENTS: 10,
} as const

/**
 * Score thresholds for evaluation results
 */
export const SCORE_THRESHOLDS = {
  STRONG: 70,
  MODERATE: 50,
  WEAK: 0,
} as const

/**
 * Score labels
 */
export const SCORE_LABELS = {
  STRONG: 'Strong Candidate',
  MODERATE: 'Moderate Chance',
  WEAK: 'Needs Improvement',
} as const

/**
 * Multi-step form configuration
 */
export const FORM_STEPS = {
  PERSONAL_INFO: 0,
  VISA_SELECTION: 1,
  DOCUMENT_UPLOAD: 2,
  REVIEW: 3,
} as const

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  EVALUATION: '/evaluation',
  RESULTS: '/results/:id',
  SEARCH: '/search',
  NOT_FOUND: '*',
} as const
