import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { evaluationIdSchema } from '../utils/validation'

export const SearchPage: React.FC = () => {
  const navigate = useNavigate()
  const [evaluationId, setEvaluationId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSearch = () => {
    setError(null)

    // Validate UUID format
    const validation = evaluationIdSchema.safeParse(evaluationId.trim())
    
    if (!validation.success) {
      setError('Invalid evaluation ID format. Please enter a valid UUID.')
      return
    }

    // Navigate to results page
    navigate(`/results/${evaluationId.trim()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 text-center">
            Search Evaluation
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 text-center">
            Enter your evaluation ID to view results
          </p>

          <div className="space-y-4">
            <div>
              <Input
                label="Evaluation ID"
                type="text"
                value={evaluationId}
                onChange={(e) => setEvaluationId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., 123e4567-e89b-12d3..."
                error={error || undefined}
              />
            </div>

            <Button 
              onClick={handleSearch} 
              className="w-full"
              disabled={!evaluationId.trim()}
            >
              Search
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-blue-600 hover:text-blue-700 underline min-h-[44px] inline-flex items-center justify-center px-4"
              >
                Back to Home
              </button>
            </div>
          </div>

          <div className="mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-700">
              <strong>Tip:</strong> Your evaluation ID was provided when you submitted your evaluation. 
              Check your email or the results page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
