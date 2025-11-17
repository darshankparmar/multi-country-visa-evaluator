import React from 'react'

interface ScoreCardProps {
  score: number
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 70) return 'Strong Candidate'
    if (score >= 50) return 'Moderate Chance'
    return 'Needs Improvement'
  }

  const getProgressBarColor = (score: number): string => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="text-center py-6 sm:py-8 border-b">
      <div className={`text-5xl sm:text-6xl font-bold ${getScoreColor(score)} mb-2`}>
        {score}/100
      </div>
      <div className="text-lg sm:text-xl text-gray-700 font-medium">
        {getScoreLabel(score)}
      </div>
      <div className="mt-4 max-w-md mx-auto bg-gray-200 rounded-full h-3 sm:h-4">
        <div 
          className={`h-3 sm:h-4 rounded-full transition-all ${getProgressBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
