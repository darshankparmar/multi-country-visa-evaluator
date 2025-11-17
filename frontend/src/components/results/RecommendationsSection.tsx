import React from 'react'

interface RecommendationsSectionProps {
  recommendations: string[]
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  recommendations
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <div className="mt-6 sm:mt-8">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
        Recommendations
      </h2>
      <ul className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg 
              className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="text-sm sm:text-base text-gray-700 leading-relaxed">
              {recommendation}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
