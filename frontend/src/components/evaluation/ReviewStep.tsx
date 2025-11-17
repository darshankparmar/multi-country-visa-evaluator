import React from 'react'
import { useEvaluationContext } from '../../context/EvaluationContext'
import { Button } from '../common/Button'
import {
  UserIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  DocumentIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

interface ReviewStepProps {
  onBack: () => void
  onSubmit: () => void
  onEdit: (step: number) => void
  loading: boolean
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ onBack, onSubmit, onEdit, loading }) => {
  const { formData } = useEvaluationContext()

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review Your Application</h2>
      <p className="text-gray-600 mb-6">
        Please review all the information before submitting your visa evaluation.
      </p>

      <div className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <button
              type="button"
              onClick={() => onEdit(0)}
              className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </button>
          </div>
          <dl className="space-y-3">
            <div className="flex items-start">
              <UserIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="text-base text-gray-900">{formData.name || 'Not provided'}</dd>
              </div>
            </div>
            <div className="flex items-start">
              <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                <dd className="text-base text-gray-900">{formData.email || 'Not provided'}</dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Visa Selection Section */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Visa Selection</h3>
            <button
              type="button"
              onClick={() => onEdit(1)}
              className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </button>
          </div>
          <dl className="space-y-3">
            <div className="flex items-start">
              <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Target Country</dt>
                <dd className="text-base text-gray-900">{formData.country || 'Not selected'}</dd>
              </div>
            </div>
            <div className="flex items-start">
              <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Visa Type</dt>
                <dd className="text-base text-gray-900">{formData.visaType || 'Not selected'}</dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Documents Section */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Documents ({formData.documents.length})
            </h3>
            <button
              type="button"
              onClick={() => onEdit(2)}
              className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </button>
          </div>
          {formData.documents.length > 0 ? (
            <ul className="space-y-2">
              {formData.documents.map((file, index) => (
                <li key={index} className="flex items-center bg-white rounded p-3 border border-gray-200">
                  <DocumentIcon className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No documents uploaded</p>
          )}
        </div>
      </div>

      {/* Important Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Important:</span> By submitting this evaluation, you confirm
          that all information provided is accurate and complete. The evaluation results are for
          informational purposes only and do not guarantee visa approval.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 mt-6 border-t">
        <Button type="button" onClick={onBack} variant="outline" disabled={loading}>
          Back
        </Button>
        <Button type="button" onClick={onSubmit} disabled={loading} loading={loading}>
          {loading ? 'Submitting...' : 'Submit Evaluation'}
        </Button>
      </div>
    </div>
  )
}
