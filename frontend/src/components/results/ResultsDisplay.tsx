import React, { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScoreCard } from './ScoreCard'
import { SummarySection } from './SummarySection'
import { RecommendationsSection } from './RecommendationsSection'
import { ConclusionSection } from './ConclusionSection'
import { ActionButtons } from './ActionButtons'
import type { EvaluationDetail } from '../../api/types'

interface ResultsDisplayProps {
  evaluation: EvaluationDetail
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(({ evaluation }) => {
  const navigate = useNavigate()

  // Defensive check for results
  if (!evaluation.results) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Evaluation Incomplete
          </h1>
          <p className="text-gray-600 mb-6">
            This evaluation has not been processed yet. Please check back later.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  // Memoize event handlers
  const handleNewEvaluation = useCallback(() => {
    navigate('/evaluation')
  }, [navigate])

  const handleBackHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleDownloadResults = useCallback(() => {
    // Optional: Implement download functionality
    const resultText = `
Visa Evaluation Results
========================

Evaluation ID: ${evaluation.evaluationId}
Score: ${evaluation.results.score}/100
Date: ${new Date(evaluation.results.evaluatedAt).toLocaleString()}

Applicant Information:
- Name: ${evaluation.userInfo.name}
- Email: ${evaluation.userInfo.email}

Visa Application:
- Country: ${evaluation.visaApplication.country}
- Visa Type: ${evaluation.visaApplication.visaType}

Documents Submitted: ${evaluation.documents.length}

Summary:
${evaluation.results.summary}

${evaluation.results.recommendations && evaluation.results.recommendations.length > 0 ? `
Recommendations:
${evaluation.results.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}
` : ''}

${evaluation.results.conclusion ? `
Conclusion:
${evaluation.results.conclusion}
` : ''}
    `.trim()

    const blob = new Blob([resultText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `visa-evaluation-${evaluation.evaluationId}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [evaluation])

  // Memoize formatted date
  const formattedDate = useMemo(
    () => new Date(evaluation.results.evaluatedAt).toLocaleString(),
    [evaluation.results.evaluatedAt]
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Evaluation Results
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 break-all">
          Evaluation ID: <span className="font-mono text-xs sm:text-sm">{evaluation.evaluationId}</span>
        </p>

        <ScoreCard score={evaluation.results.score} />
        
        <SummarySection 
          summary={evaluation.results.summary}
          visaType={evaluation.visaApplication.visaType}
          country={evaluation.visaApplication.country}
        />

        {evaluation.results.recommendations && evaluation.results.recommendations.length > 0 && (
          <RecommendationsSection recommendations={evaluation.results.recommendations} />
        )}

        {evaluation.results.conclusion && (
          <ConclusionSection 
            conclusion={evaluation.results.conclusion}
            score={evaluation.results.score}
          />
        )}

        <div className="mt-6 sm:mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <dt className="text-sm text-gray-600">Name</dt>
              <dd className="font-medium text-gray-900 break-words">{evaluation.userInfo.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Email</dt>
              <dd className="font-medium text-gray-900 break-all">{evaluation.userInfo.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Documents Submitted</dt>
              <dd className="font-medium text-gray-900">{evaluation.documents.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Evaluated At</dt>
              <dd className="font-medium text-gray-900 text-sm">
                {formattedDate}
              </dd>
            </div>
          </dl>
        </div>

        <ActionButtons 
          onNewEvaluation={handleNewEvaluation}
          onBackHome={handleBackHome}
          onDownloadResults={handleDownloadResults}
        />
      </div>
    </div>
  )
})
