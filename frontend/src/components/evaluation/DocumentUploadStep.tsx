import React, { useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useEvaluationContext } from '../../context/EvaluationContext'
import { useFileUpload } from '../../hooks/useFileUpload'
import { Button } from '../common/Button'
import { DocumentIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'

interface DocumentUploadStepProps {
  onNext: () => void
  onBack: () => void
}

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({ onNext, onBack }) => {
  const { formData, updateFormData } = useEvaluationContext()
  const { files, errors, addFiles, removeFile } = useFileUpload()
  const initializedRef = useRef(false)

  // Initialize files from context on mount (only once)
  useEffect(() => {
    if (!initializedRef.current && formData.documents.length > 0) {
      addFiles(formData.documents)
      initializedRef.current = true
    }
  }, [formData.documents, addFiles])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addFiles(acceptedFiles)
    },
    [addFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true
  })

  const handleRemove = (index: number) => {
    removeFile(index)
  }

  const handleNext = () => {
    if (files.length > 0) {
      updateFormData({ documents: files })
      onNext()
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Upload Documents</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6">
        Upload the required documents for your visa application. You can upload multiple files.
      </p>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all touch-manipulation
          ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
        {isDragActive ? (
          <p className="text-base sm:text-lg text-primary-600 font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-base sm:text-lg text-gray-700 font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Supported formats: PDF, DOC, DOCX, JPG, PNG
            </p>
            <p className="text-xs sm:text-sm text-gray-500">Maximum file size: 5MB per file</p>
          </>
        )}
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Upload Errors:</h4>
          <ul className="space-y-1">
            {errors.map((error, i) => (
              <li key={i} className="text-sm text-red-700">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
            Uploaded Files ({files.length})
          </h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <DocumentIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="ml-2 sm:ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Remove ${file.name}`}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Files Message */}
      {files.length === 0 && errors.length === 0 && (
        <div className="mt-6 text-center py-8">
          <p className="text-sm sm:text-base text-gray-500">No files uploaded yet</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 mt-6 border-t">
        <Button type="button" onClick={onBack} variant="outline" className="w-full sm:w-auto order-2 sm:order-1">
          Back
        </Button>
        <Button type="button" onClick={handleNext} disabled={files.length === 0} className="w-full sm:w-auto order-1 sm:order-2">
          Next
        </Button>
      </div>
    </div>
  )
}
