import React, { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScoreCard } from './ScoreCard'
import { SummarySection } from './SummarySection'
import { RecommendationsSection } from './RecommendationsSection'
import { ConclusionSection } from './ConclusionSection'
import { ActionButtons } from './ActionButtons'
import { CriteriaAnalysisSection } from './CriteriaAnalysisSection'
import { ScoreBreakdownSection } from './ScoreBreakdownSection'
import { DocumentsAnalyzedSection } from './DocumentsAnalyzedSection'
import type { EvaluationDetail, ApprovalLikelihood } from '../../api/types'

interface ResultsDisplayProps {
  evaluation: EvaluationDetail
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(({ evaluation }) => {
  const navigate = useNavigate()

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

${evaluation.results.prioritizedRecommendations && evaluation.results.prioritizedRecommendations.length > 0 ? `
Recommendations:
${evaluation.results.prioritizedRecommendations.map((rec, idx) => `${idx + 1}. [${rec.priority}] ${rec.text}${rec.relatedCriterion ? ` (Related to: ${rec.relatedCriterion})` : ''}`).join('\n')}
` : evaluation.results.recommendations && evaluation.results.recommendations.length > 0 ? `
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
    () => evaluation.results ? new Date(evaluation.results.evaluatedAt).toLocaleString() : '',
    [evaluation.results]
  )

  // Subtask 13.2: Check if new structured data exists
  const hasStructuredData = useMemo(() => ({
    criteriaAnalysis: Boolean(evaluation.results?.criteriaAnalysis && evaluation.results.criteriaAnalysis.length > 0),
    prioritizedRecommendations: Boolean(evaluation.results?.prioritizedRecommendations && evaluation.results.prioritizedRecommendations.length > 0),
    scoreBreakdown: Boolean(evaluation.results?.scoreBreakdown),
    approvalLikelihood: Boolean(evaluation.results?.approvalLikelihood)
  }), [evaluation.results])

  // Subtask 13.7: Helper function to get approval likelihood color
  const getApprovalLikelihoodColor = (likelihood: ApprovalLikelihood): string => {
    switch (likelihood) {
      case 'Strong':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'Good':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Needs Improvement':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'Low':
      case 'Not Viable':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

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
            onClick={handleBackHome}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

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
        
        {/* Subtask 13.7: Add approval likelihood display near score */}
        {hasStructuredData.approvalLikelihood && evaluation.results.approvalLikelihood && (
          <div className="mt-4 flex justify-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium ${getApprovalLikelihoodColor(evaluation.results.approvalLikelihood)}`}>
              <svg 
                className="w-5 h-5" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="text-sm sm:text-base">
                Approval Likelihood: <strong>{evaluation.results.approvalLikelihood}</strong>
              </span>
            </div>
          </div>
        )}
        
        {/* Subtask 13.3: Add CriteriaAnalysisSection after ScoreCard */}
        {hasStructuredData.criteriaAnalysis && evaluation.results.criteriaAnalysis && (
          <CriteriaAnalysisSection criteriaAnalysis={evaluation.results.criteriaAnalysis} />
        )}
        
        {/* Subtask 13.4: Add ScoreBreakdownSection after CriteriaAnalysisSection */}
        {hasStructuredData.scoreBreakdown && evaluation.results.scoreBreakdown && (
          <ScoreBreakdownSection scoreBreakdown={evaluation.results.scoreBreakdown} />
        )}
        
        <SummarySection 
          summary={evaluation.results.summary}
          visaType={evaluation.visaApplication.visaType}
          country={evaluation.visaApplication.country}
        />

        {/* Subtask 13.5: Update RecommendationsSection usage - handle both old and new format gracefully */}
        {hasStructuredData.prioritizedRecommendations && evaluation.results.prioritizedRecommendations ? (
          <RecommendationsSection recommendations={evaluation.results.prioritizedRecommendations} />
        ) : evaluation.results.recommendations && evaluation.results.recommendations.length > 0 ? (
          <RecommendationsSection 
            recommendations={evaluation.results.recommendations.map(rec => ({
              priority: 'MEDIUM' as const,
              text: rec,
              relatedCriterion: undefined
            }))} 
          />
        ) : null}

        {evaluation.results.conclusion && (
          <ConclusionSection 
            conclusion={evaluation.results.conclusion}
            score={evaluation.results.score}
          />
        )}

        {/* Subtask 13.6: Add DocumentsAnalyzedSection in application details area */}
        {evaluation.documents && evaluation.documents.length > 0 && (
          <DocumentsAnalyzedSection 
            documents={evaluation.documents}
            parsedDocuments={evaluation.parsedDocuments}
            validationResults={evaluation.results.validationResults}
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
