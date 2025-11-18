import React, { useState } from 'react'
import type { ReactNode } from 'react'
import { EvaluationContext, type EvaluationFormData } from './evaluationContextDefinition'

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
