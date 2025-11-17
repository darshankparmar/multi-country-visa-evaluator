import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personalInfoSchema } from '../../utils/validation'
import { useEvaluationContext } from '../../context/EvaluationContext'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { z } from 'zod'

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>

interface PersonalInfoStepProps {
  onNext: () => void
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ onNext }) => {
  const { formData, updateFormData } = useEvaluationContext()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    mode: 'onChange',
    defaultValues: {
      name: formData.name,
      email: formData.email
    }
  })

  const onSubmit = (data: PersonalInfoFormData) => {
    updateFormData(data)
    onNext()
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Personal Information</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6">Please provide your basic information to get started.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Full Name"
          id="name"
          type="text"
          placeholder="Enter your full name"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email Address"
          id="email"
          type="email"
          placeholder="Enter your email address"
          error={errors.email?.message}
          helperText="We'll use this to send you evaluation results"
          {...register('email')}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={!isValid} className="w-full sm:w-auto">
            Next
          </Button>
        </div>
      </form>
    </div>
  )
}
