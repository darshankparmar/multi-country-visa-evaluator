import React, { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Form data structure for visa evaluation
 */
interface EvaluationFormData {
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
interface EvaluationContextType {
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

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined)

/**
 * Provider component for evaluation form state
 * 
 * Manages the state for the multi-step evaluation form, including:
 * - Form data (personal info, visa selection, documents)
 * - Current step tracking
 * - Form data updates
 * - Form reset functionality
 * 
 * @component
 * @example
 * ```tsx
 * <EvaluationProvider>
 *   <EvaluationForm />
 * </EvaluationProvider>
 * ```
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export const EvaluationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<EvaluationFormData>({
    name: '',
    email: '',
    country: '',
    visaType: '',
    documents: []
  })
  const [currentStep, setCurrentStep] = useState(0)

  const updateFormData = (data: Partial<EvaluationFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      country: '',
      visaType: '',
      documents: []
    })
    setCurrentStep(0)
  }

  return (
    <EvaluationContext.Provider value={{
      formData,
      currentStep,
      updateFormData,
      setCurrentStep,
      resetForm
    }}>
      {children}
    </EvaluationContext.Provider>
  )
}

/**
 * Hook to access evaluation form context
 * 
 * Must be used within an EvaluationProvider component.
 * 
 * @returns {EvaluationContextType} Evaluation context value
 * @throws {Error} If used outside of EvaluationProvider
 * 
 * @example
 * ```tsx
 * const { formData, updateFormData, currentStep } = useEvaluationContext()
 * 
 * // Update form data
 * updateFormData({ name: 'John Doe', email: 'john@example.com' })
 * 
 * // Access current step
 * console.log(currentStep) // 0, 1, 2, or 3
 * ```
 */
export const useEvaluationContext = () => {
  const context = useContext(EvaluationContext)
  if (!context) {
    throw new Error('useEvaluationContext must be used within EvaluationProvider')
  }
  return context
}
