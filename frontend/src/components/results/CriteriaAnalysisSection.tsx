import React, { useMemo } from 'react'
import type { CriterionAnalysis, CriterionRating } from '../../api/types'

interface CriteriaAnalysisSectionProps {
  criteriaAnalysis: CriterionAnalysis[]
}

export const CriteriaAnalysisSection: React.FC<CriteriaAnalysisSectionProps> = ({
  criteriaAnalysis
}) => {
  // Sort critical requirements first, then by rating (CRITICAL_GAP → WEAK → MODERATE → GOOD → STRONG)
  const sortedCriteria = useMemo(() => {
    const ratingOrder: Record<CriterionRating, number> = {
      'CRITICAL_GAP': 0,
      'WEAK': 1,
      'MODERATE': 2,
      'GOOD': 3,
      'STRONG': 4
    }

    return [...criteriaAnalysis].sort((a, b) => {
      // Critical requirements first
      if (a.isCritical && !b.isCritical) return -1
      if (!a.isCritical && b.isCritical) return 1
      
      // Then sort by rating (worst to best)
      return ratingOrder[a.rating] - ratingOrder[b.rating]
    })
  }, [criteriaAnalysis])

  const getRatingColor = (rating: CriterionRating): string => {
    switch (rating) {
      case 'STRONG':
      case 'GOOD':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'WEAK':
      case 'CRITICAL_GAP':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (!criteriaAnalysis || criteriaAnalysis.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
        {sortedCriteria.map((criterion, index) => (
          <div 
            key={index}
            className={`border rounded-lg p-4 transition-all ${
              criterion.isCritical 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
              <div className="flex-1">
                {/* Criterion name with badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    {criterion.name}
                  </h3>
                  {criterion.isCritical && (
                    <span className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded">
                      CRITICAL
                    </span>
                  )}
                  <span 
                    className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full border ${getRatingColor(criterion.rating)}`}
                  >
                    {criterion.rating.replace('_', ' ')}
                  </span>
                </div>
                
                {/* Evidence section */}
                {criterion.evidence && criterion.evidence.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Evidence:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {criterion.evidence.map((ev, i) => (
                        <li key={i} className="leading-relaxed">{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Gaps section */}
                {criterion.gaps && criterion.gaps.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-red-700 mb-1">Gaps:</p>
                    <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                      {criterion.gaps.map((gap, i) => (
                        <li key={i} className="leading-relaxed">{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Recommendation section */}
                {criterion.recommendation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong className="font-semibold">Recommendation:</strong>{' '}
                      {criterion.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}
