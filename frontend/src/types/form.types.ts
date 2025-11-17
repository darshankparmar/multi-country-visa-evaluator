/**
 * Form-related TypeScript interfaces and types
 */

/**
 * Multi-step form data structure
 */
export interface EvaluationFormData {
  name: string
  email: string
  country: string
  visaType: string
  documents: File[]
}

/**
 * Form step information
 */
export interface FormStep {
  id: number
  name: string
  description?: string
  isComplete?: boolean
}

/**
 * Form validation error
 */
export interface FormError {
  field: string
  message: string
}

/**
 * Form field props
 */
export interface FormFieldProps {
  label: string
  name: string
  error?: string
  required?: boolean
  disabled?: boolean
}

/**
 * File upload validation result
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
}
