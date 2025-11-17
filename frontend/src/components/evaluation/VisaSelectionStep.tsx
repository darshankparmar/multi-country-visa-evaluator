import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { visaSelectionSchema } from '../../utils/validation'
import { useEvaluationContext } from '../../context/EvaluationContext'
import { useVisaTypes } from '../../hooks/useVisaTypes'
import { Select } from '../common/Select'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ErrorMessage } from '../common/ErrorMessage'
import { z } from 'zod'

type VisaSelectionFormData = z.infer<typeof visaSelectionSchema>

interface VisaSelectionStepProps {
  onNext: () => void
  onBack: () => void
}

export const VisaSelectionStep: React.FC<VisaSelectionStepProps> = ({ onNext, onBack }) => {
  const { formData, updateFormData } = useEvaluationContext()
  const [selectedCountry, setSelectedCountry] = useState(formData.country)

  // Fetch countries initially
  const { countries, loading: countriesLoading, error: countriesError } = useVisaTypes()

  // Fetch visa types when country is selected
  const {
    visaTypes,
    loading: visaTypesLoading,
    error: visaTypesError
  } = useVisaTypes(selectedCountry)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<VisaSelectionFormData>({
    resolver: zodResolver(visaSelectionSchema),
    mode: 'onChange',
    defaultValues: {
      country: formData.country,
      visaType: formData.visaType
    }
  })

  const watchCountry = watch('country')
  const watchVisaType = watch('visaType')

  // Update selected country when form country changes
  useEffect(() => {
    if (watchCountry && watchCountry !== selectedCountry) {
      setSelectedCountry(watchCountry)
      // Reset visa type when country changes
      setValue('visaType', '')
    }
  }, [watchCountry, selectedCountry, setValue])

  const onSubmit = (data: VisaSelectionFormData) => {
    updateFormData(data)
    onNext()
  }

  // Find selected visa type details
  const selectedVisaType = visaTypes.find((vt) => vt.visaType === watchVisaType)

  if (countriesLoading) {
    return <LoadingSpinner text="Loading countries..." />
  }

  if (countriesError) {
    return <ErrorMessage message={countriesError} onRetry={() => window.location.reload()} />
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Visa Selection</h2>
      <p className="text-gray-600 mb-6">Select your target country and visa type.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Country Selector */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Target Country
          </label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                options={countries.map((c) => ({ value: c.name, label: c.name }))}
                placeholder="Select a country"
                error={errors.country?.message}
              />
            )}
          />
        </div>

        {/* Visa Type Selector */}
        {selectedCountry && (
          <div>
            <label htmlFor="visaType" className="block text-sm font-medium text-gray-700 mb-1">
              Visa Type
            </label>
            {visaTypesLoading ? (
              <div className="py-4">
                <LoadingSpinner text="Loading visa types..." />
              </div>
            ) : visaTypesError ? (
              <ErrorMessage message={visaTypesError} />
            ) : (
              <Controller
                name="visaType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={visaTypes.map((vt) => ({
                      value: vt.visaType,
                      label: vt.visaType
                    }))}
                    placeholder="Select a visa type"
                    error={errors.visaType?.message}
                    disabled={visaTypes.length === 0}
                  />
                )}
              />
            )}
          </div>
        )}

        {/* Visa Type Details */}
        {selectedVisaType && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{selectedVisaType.visaType}</h3>
            {selectedVisaType.description && (
              <p className="text-sm text-gray-700 mb-3">{selectedVisaType.description}</p>
            )}
            {selectedVisaType.processingTime && (
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Processing Time:</span> {selectedVisaType.processingTime}
              </p>
            )}
            {selectedVisaType.requiredDocuments && selectedVisaType.requiredDocuments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Required Documents:</p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedVisaType.requiredDocuments.map((doc, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button type="button" onClick={onBack} variant="outline">
            Back
          </Button>
          <Button type="submit" disabled={!isValid}>
            Next
          </Button>
        </div>
      </form>
    </div>
  )
}
