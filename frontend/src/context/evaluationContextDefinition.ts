import { createContext } from 'react'

/**
 * Form data structure for visa evaluation
 */
export interface EvaluationFormData {
  /** Applicant's full name */
  name: string
  /** Applicant's email address */
  email: string
  /** Target country for visa application */
  country: string
  /** Selected visa type */
  visaType: string
  /** Uploaded document files */
  documents: File[]
}

/**
 * Context type for evaluation form state management
 */
export interface EvaluationContextType {
  /** Current form data */
  formData: EvaluationFormData
  /** Current step index (0-3) */
  currentStep: number
  /** Update form data partially */
  updateFormData: (data: Partial<EvaluationFormData>) => void
  /** Set current step */
  setCurrentStep: (step: number) => void
  /** Reset form to initial state */
  resetForm: () => void
}

export const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined)
