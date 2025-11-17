import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEvaluationContext } from '../../context/EvaluationContext'
import { StepIndicator } from './StepIndicator'
import { PersonalInfoStep } from './PersonalInfoStep'
import { VisaSelectionStep } from './VisaSelectionStep'
import { DocumentUploadStep } from './DocumentUploadStep'
import { ReviewStep } from './ReviewStep'
import { evaluationApi } from '../../api/evaluations'
import { toast } from 'react-hot-toast'

/**
 * Configuration for the multi-step evaluation form
 */
const STEPS = [
  { id: 0, name: 'Personal Info' },
  { id: 1, name: 'Visa Selection' },
  { id: 2, name: 'Documents' },
  { id: 3, name: 'Review' }
]

/**
 * Multi-step evaluation form component
 * 
 * Manages the complete visa evaluation submission flow with 4 steps:
 * 1. Personal Information (name, email)
 * 2. Visa Selection (country, visa type)
 * 3. Document Upload (file uploads)
 * 4. Review and Submit
 * 
 * @component
 * @example
 * ```tsx
 * // Wrap with EvaluationProvider for context
 * <EvaluationProvider>
 *   <EvaluationForm />
 * </EvaluationProvider>
 * ```
 * 
 * Features:
 * - Step-by-step navigation with progress indicator
 * - Form data persistence across steps
 * - Validation at each step
 * - Loading states during submission
 * - Error handling with toast notifications
 * - Automatic navigation to results page on success
 * 
 * @returns {JSX.Element} Multi-step form with current step content
 */
export const EvaluationForm: React.FC = () => {
  const { formData, currentStep, setCurrentStep, resetForm } = useEvaluationContext()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Memoize event handlers with useCallback
  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      // Scroll to top when changing steps
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep, setCurrentStep])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      // Scroll to top when changing steps
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep, setCurrentStep])

  const handleEdit = useCallback((step: number) => {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setCurrentStep])

  const handleSubmit = useCallback(async () => {
    setLoading(true)
    try {
      const response = await evaluationApi.submitEvaluation({
        name: formData.name,
        email: formData.email,
        country: formData.country,
        visaType: formData.visaType,
        documents: formData.documents
      })

      toast.success('Evaluation submitted successfully!')
      
      // Reset form after successful submission
      resetForm()
      
      // Navigate to results page with evaluation data
      navigate(`/results/${response.evaluationId}`, {
        state: { evaluation: response }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit evaluation'
      toast.error(errorMessage)
      console.error('Submission error:', error)
    } finally {
      setLoading(false)
    }
  }, [formData, navigate, resetForm])

  // Memoize current step component
  const currentStepComponent = useMemo(() => {
    switch (currentStep) {
      case 0:
        return <PersonalInfoStep onNext={handleNext} />
      case 1:
        return <VisaSelectionStep onNext={handleNext} onBack={handleBack} />
      case 2:
        return <DocumentUploadStep onNext={handleNext} onBack={handleBack} />
      case 3:
        return (
          <ReviewStep
            onBack={handleBack}
            onSubmit={handleSubmit}
            onEdit={handleEdit}
            loading={loading}
          />
        )
      default:
        return null
    }
  }, [currentStep, handleNext, handleBack, handleSubmit, handleEdit, loading])

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
      {/* Step Indicator */}
      <div className="mb-6 sm:mb-8">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Current Step Content */}
      <div className="mt-6 sm:mt-8">{currentStepComponent}</div>
    </div>
  )
}
