import React from 'react'
import type { ScoreBreakdown } from '../../api/types'

interface ScoreBreakdownSectionProps {
  scoreBreakdown: ScoreBreakdown
}

/**
 * Component to display detailed score breakdown with penalties and criterion contributions
 */
export const ScoreBreakdownSection: React.FC<ScoreBreakdownSectionProps> = ({
  scoreBreakdown
}) => {
  if (!scoreBreakdown) {
    return null
  }

  const getScoreInterpretation = (score: number): { text: string; color: string } => {
    if (score >= 81) {
      return {
        text: 'Strong application - High likelihood of approval',
        color: 'text-green-700'
      }
    } else if (score >= 61) {
      return {
        text: 'Good application - Favorable approval chances',
        color: 'text-blue-700'
      }
    } else if (score >= 41) {
      return {
        text: 'Moderate application - Needs improvement in key areas',
        color: 'text-yellow-700'
      }
    } else if (score >= 20) {
      return {
        text: 'Needs significant improvement - Address critical gaps',
        color: 'text-orange-700'
      }
    } else {
      return {
        text: 'Low viability - Major requirements not met',
        color: 'text-red-700'
      }
    }
  }

  const getPerformanceColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    if (percentage >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const interpretation = getScoreInterpretation(scoreBreakdown.adjustedScore)

  return (
    <div className="space-y-4 sm:space-y-6">
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200">
            {/* Base score */}
            <div className="flex justify-between items-center mb-2 pb-2">
              <span className="text-sm sm:text-base text-gray-700 font-medium">
                Base Score (from validation):
              </span>
              <span className="text-lg sm:text-xl font-semibold text-gray-900">
                {scoreBreakdown.baseScore}/100
              </span>
            </div>
            
            {/* Penalties section */}
            {scoreBreakdown.penalties && scoreBreakdown.penalties.length > 0 && (
              <>
                <div className="mt-4 mb-2">
                  <p className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <svg 
                      className="w-5 h-5" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Penalties Applied:
                  </p>
                  <div className="space-y-2">
                    {scoreBreakdown.penalties.map((penalty, index) => (
                      <div 
                        key={index} 
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-sm bg-red-50 p-3 rounded border border-red-200"
                      >
                        <div className="flex-1">
                          <span className="font-medium text-red-800">
                            {penalty.requirement}
                          </span>
                          <span className="text-red-600 block sm:inline sm:ml-2">
                            {penalty.reason}
                          </span>
                        </div>
                        <span className="font-semibold text-red-700 whitespace-nowrap">
                          -{penalty.points} points
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Total penalty */}
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-300">
                  <span className="text-sm sm:text-base text-gray-700 font-medium">
                    Total Penalty:
                  </span>
                  <span className="text-lg sm:text-xl font-semibold text-red-700">
                    -{scoreBreakdown.totalPenalty}
                  </span>
                </div>
              </>
            )}
            
            {/* Final adjusted score */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-gray-400">
              <span className="text-base sm:text-lg font-semibold text-gray-900">
                Final Score:
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                {scoreBreakdown.adjustedScore}/100
              </span>
            </div>

            {/* Score interpretation */}
            <div className={`mt-4 p-3 bg-blue-50 rounded border border-blue-200`}>
              <p className={`text-sm sm:text-base font-medium ${interpretation.color}`}>
                {interpretation.text}
              </p>
            </div>
          </div>
          
          {scoreBreakdown.breakdown && scoreBreakdown.breakdown.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                Criterion Contributions:
              </h3>
              <div className="space-y-3">
                {scoreBreakdown.breakdown.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    {/* Criterion name and score */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {item.criterion}
                      </span>
                      <span className="text-sm text-gray-600 font-medium">
                        {item.points}/{item.maxPoints} points ({item.percentage}%)
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-300 ${getPerformanceColor(item.percentage)}`}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        role="progressbar"
                        aria-valuenow={item.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${item.criterion} score: ${item.percentage}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
    </div>
  )
}
