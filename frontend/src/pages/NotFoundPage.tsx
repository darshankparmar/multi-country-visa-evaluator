import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-8">
              Sorry, the page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="space-y-4">
            <Button onClick={() => navigate('/')} className="w-full sm:w-auto">
              Go Home
            </Button>
            
            <div className="text-center">
              <button
                onClick={() => navigate(-1)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Go Back
              </button>
            </div>
          </div>

          <div className="mt-12 text-gray-500">
            <p className="text-sm">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
