import React from 'react'
import { CheckIcon } from '@heroicons/react/24/solid'

interface Step {
  id: number
  name: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export const StepIndicator: React.FC<StepIndicatorProps> = React.memo(({ steps, currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between w-full gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <li
              key={step.id}
              className="flex items-center flex-1"
            >
              <div className="flex flex-col items-center flex-1 w-full">
                {/* Step Circle */}
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all
                    ${
                      isCompleted
                        ? 'bg-primary-600 border-primary-600'
                        : isCurrent
                        ? 'border-primary-600 bg-white'
                        : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <span
                      className={`text-sm sm:text-base font-semibold ${
                        isCurrent ? 'text-primary-600' : 'text-gray-500'
                      }`}
                    >
                      {step.id + 1}
                    </span>
                  )}
                </div>

                {/* Step Name */}
                <span
                  className={`
                    mt-2 text-xs sm:text-sm font-medium text-center px-1 leading-tight
                    ${
                      isCurrent
                        ? 'text-primary-600'
                        : isCompleted
                        ? 'text-gray-700'
                        : 'text-gray-500'
                    }
                  `}
                >
                  {step.name}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
})
