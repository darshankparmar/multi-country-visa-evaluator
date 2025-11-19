import React from 'react'
import ReactMarkdown from 'react-markdown'

interface SummarySectionProps {
  summary: string
  visaType: string
  country: string
}

export const SummarySection: React.FC<SummarySectionProps> = ({ 
  summary, 
  visaType, 
  country 
}) => {
  return (
    <div>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg 
              className="h-5 w-5 text-blue-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-blue-800 break-words">
              {country} - {visaType}
            </p>
          </div>
        </div>
      </div>

      <div className="prose prose-sm sm:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:text-gray-700">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  )
}
