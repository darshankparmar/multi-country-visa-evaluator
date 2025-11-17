import React, { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface EvaluationFormData {
  name: string
  email: string
  country: string
  visaType: string
  documents: File[]
}

interface EvaluationContextType {
  formData: EvaluationFormData
  currentStep: number
  updateFormData: (data: Partial<EvaluationFormData>) => void
  setCurrentStep: (step: number) => void
  resetForm: () => void
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined)

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

export const useEvaluationContext = () => {
  const context = useContext(EvaluationContext)
  if (!context) {
    throw new Error('useEvaluationContext must be used within EvaluationProvider')
  }
  return context
}
