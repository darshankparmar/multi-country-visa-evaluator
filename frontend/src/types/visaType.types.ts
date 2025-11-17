/**
 * Visa type-related TypeScript interfaces and types
 */

/**
 * Visa type information
 */
export interface VisaType {
  _id: string
  country: string
  visaType: string
  requiredDocuments: string[]
  description?: string
  processingTime?: string
  active: boolean
}

/**
 * Country information
 */
export interface Country {
  name: string
}

/**
 * Visa type with additional metadata
 */
export interface VisaTypeWithMetadata extends VisaType {
  popularity?: number
  successRate?: number
}
