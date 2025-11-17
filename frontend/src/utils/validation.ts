import { z } from 'zod'

/**
 * Validation schema for personal information step
 * Validates name and email fields
 */
export const personalInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address')
})

/**
 * Validation schema for visa selection step
 * Validates country and visa type selection
 */
export const visaSelectionSchema = z.object({
  country: z.string().min(1, 'Please select a country'),
  visaType: z.string().min(1, 'Please select a visa type')
})

/**
 * Validation schema for document upload step
 * Validates that at least one document is uploaded
 */
export const documentUploadSchema = z.object({
  documents: z.array(z.instanceof(File)).min(1, 'At least one document is required')
})

/**
 * Validation schema for evaluation ID
 * Validates UUID format for evaluation ID lookups
 */
export const evaluationIdSchema = z.string().uuid('Invalid evaluation ID format')

/**
 * Type exports for use in components
 */
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>
export type VisaSelectionFormData = z.infer<typeof visaSelectionSchema>
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>
