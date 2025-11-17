import React from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  className?: string
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <ExclamationCircleIcon className="w-10 h-10 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-center text-gray-600 mb-4 max-w-md">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="primary">
          Try Again
        </Button>
      )}
    </div>
  )
}
