import React from 'react'
import { EvaluationProvider } from '../context/EvaluationContext'
import { EvaluationForm } from '../components/evaluation/EvaluationForm'

export const EvaluationPage: React.FC = () => {
  return (
    <EvaluationProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
              Visa Evaluation Form
            </h1>
            <EvaluationForm />
          </div>
        </div>
      </div>
    </EvaluationProvider>
  )
}
