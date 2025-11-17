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

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <li
              key={step.id}
              className={`flex items-center ${
                index !== steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div className="flex flex-col items-center flex-1">
                {/* Step Circle */}
                <div className="flex items-center">
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
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
                      <CheckIcon className="w-6 h-6 text-white" />
                    ) : (
                      <span
                        className={`text-sm font-semibold ${
                          isCurrent ? 'text-primary-600' : 'text-gray-500'
                        }`}
                      >
                        {step.id + 1}
                      </span>
                    )}
                  </div>

                  {/* Connector Line */}
                  {index !== steps.length - 1 && (
                    <div
                      className={`
                        hidden sm:block w-full h-0.5 mx-2 transition-all
                        ${isCompleted ? 'bg-primary-600' : 'bg-gray-300'}
                      `}
                      style={{ minWidth: '40px' }}
                    />
                  )}
                </div>

                {/* Step Name */}
                <span
                  className={`
                    mt-2 text-xs sm:text-sm font-medium text-center
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
}
