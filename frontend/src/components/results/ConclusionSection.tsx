import React from 'react'

interface ConclusionSectionProps {
  conclusion: string
  score: number
}

export const ConclusionSection: React.FC<ConclusionSectionProps> = ({
  conclusion,
  score
}) => {
  if (!conclusion) {
    return null
  }

  // Calculate border and background colors based on score
  const borderColor = score >= 70 
    ? 'border-green-500' 
    : score >= 50 
    ? 'border-yellow-500' 
    : 'border-red-500'

  const bgColor = score >= 70 
    ? 'bg-green-50' 
    : score >= 50 
    ? 'bg-yellow-50' 
    : 'bg-red-50'

  return (
    <div className={`${bgColor} ${borderColor} border-l-4 p-4 sm:p-6 rounded-lg`}>
      <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
        {conclusion}
      </p>
    </div>
  )
}
