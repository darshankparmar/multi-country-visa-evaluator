import React, { useMemo } from 'react'
import type { PrioritizedRecommendation } from '../../api/types'

interface RecommendationsSectionProps {
  recommendations: PrioritizedRecommendation[]
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  recommendations
}) => {
  // Sort recommendations by priority (CRITICAL → HIGH → MEDIUM → LOW)
  const sortedRecommendations = useMemo(() => {
    if (!recommendations || recommendations.length === 0) {
      return []
    }
    
    const priorityOrder: Record<string, number> = {
      'CRITICAL': 0,
      'HIGH': 1,
      'MEDIUM': 2,
      'LOW': 3
    }
    
    return [...recommendations].sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    )
  }, [recommendations])

  if (!sortedRecommendations || sortedRecommendations.length === 0) {
    return null
  }

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPriorityIcon = (priority: string): React.ReactElement => {
    switch (priority) {
      case 'CRITICAL':
        // Alert icon
        return (
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'HIGH':
        // Warning icon
        return (
          <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'MEDIUM':
        // Clipboard icon
        return (
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        )
      case 'LOW':
        // Info icon
        return (
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div className="space-y-3">
        {sortedRecommendations.map((rec, index) => (
          <div 
            key={index}
            className={`flex items-start gap-3 p-4 rounded-lg border ${
              rec.priority === 'CRITICAL' ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'
            }`}
          >
            {getPriorityIcon(rec.priority)}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded border ${getPriorityColor(rec.priority)}`}>
                  {rec.priority}
                </span>
                {rec.relatedCriterion && (
                  <span className="text-xs text-gray-500">
                    Related to: {rec.relatedCriterion}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                {rec.text}
              </p>
            </div>
          </div>
        ))}
    </div>
  )
}
