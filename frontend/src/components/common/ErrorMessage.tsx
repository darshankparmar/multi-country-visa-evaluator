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
    <div className={`flex flex-col items-center justify-center p-4 sm:p-6 ${className}`}>
      <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full mb-3 sm:mb-4">
        <ExclamationCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 text-center">
        Something went wrong
      </h3>
      <p className="text-sm sm:text-base text-center text-gray-600 mb-4 max-w-md px-2">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="primary" className="w-full sm:w-auto">
          Try Again
        </Button>
      )}
    </div>
  )
}
