/**
 * General helper utility functions
 */

import { FILE_UPLOAD, SCORE_THRESHOLDS, SCORE_LABELS } from './constants'

/**
 * Validate file type
 * @param file - File to validate
 * @returns True if file type is allowed
 */
export const isValidFileType = (file: File): boolean => {
  return FILE_UPLOAD.ALLOWED_TYPES.includes(file.type as typeof FILE_UPLOAD.ALLOWED_TYPES[number])
}

/**
 * Validate file size
 * @param file - File to validate
 * @returns True if file size is within limit
 */
export const isValidFileSize = (file: File): boolean => {
  return file.size <= FILE_UPLOAD.MAX_SIZE
}

/**
 * Get score color class based on score value
 * @param score - Score value (0-100)
 * @returns Tailwind color class
 */
export const getScoreColor = (score: number): string => {
  if (score >= SCORE_THRESHOLDS.STRONG) return 'text-success-600'
  if (score >= SCORE_THRESHOLDS.MODERATE) return 'text-warning-600'
  return 'text-error-600'
}

/**
 * Get score background color class based on score value
 * @param score - Score value (0-100)
 * @returns Tailwind background color class
 */
export const getScoreBgColor = (score: number): string => {
  if (score >= SCORE_THRESHOLDS.STRONG) return 'bg-success-500'
  if (score >= SCORE_THRESHOLDS.MODERATE) return 'bg-warning-500'
  return 'bg-error-500'
}

/**
 * Get score label based on score value
 * @param score - Score value (0-100)
 * @returns Score label string
 */
export const getScoreLabel = (score: number): string => {
  if (score >= SCORE_THRESHOLDS.STRONG) return SCORE_LABELS.STRONG
  if (score >= SCORE_THRESHOLDS.MODERATE) return SCORE_LABELS.MODERATE
  return SCORE_LABELS.WEAK
}

/**
 * Validate UUID format
 * @param id - String to validate
 * @returns True if valid UUID
 */
export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Debounce function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Sleep/delay function
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate a random ID (for temporary use)
 * @returns Random string ID
 */
export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}
