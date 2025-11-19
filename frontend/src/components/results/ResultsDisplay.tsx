import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SummarySection } from './SummarySection'
import { RecommendationsSection } from './RecommendationsSection'
import { ConclusionSection } from './ConclusionSection'
import { ActionButtons } from './ActionButtons'
import { CriteriaAnalysisSection } from './CriteriaAnalysisSection'
import { ScoreBreakdownSection } from './ScoreBreakdownSection'
import type { EvaluationDetail, ApprovalLikelihood } from '../../api/types'

interface ResultsDisplayProps {
  evaluation: EvaluationDetail
}

interface SectionState {
  criteriaAnalysis: boolean
  scoreBreakdown: boolean
  summary: boolean
  recommendations: boolean
  conclusion: boolean
  applicationDetails: boolean
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(({ evaluation }) => {
  const navigate = useNavigate()

  // State for expand/collapse sections
  const [expandedSections, setExpandedSections] = useState<SectionState>({
    criteriaAnalysis: true,
    scoreBreakdown: false,
    summary: true,
    recommendations: true,
    conclusion: true,
    applicationDetails: false
  })

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string
  icon: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
  badge?: string
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  badge
}) => {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-hidden="true">{icon}</span>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h2>
          {badge && (
            <span className="hidden sm:inline-flex px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}

  // Toggle section expansion
  const toggleSection = useCallback((section: keyof SectionState) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  // Expand all sections
  const expandAll = useCallback(() => {
    setExpandedSections({
      criteriaAnalysis: true,
      scoreBreakdown: true,
      summary: true,
      recommendations: true,
      conclusion: true,
      applicationDetails: true
    })
  }, [])

  // Collapse all sections
  const collapseAll = useCallback(() => {
    setExpandedSections({
      criteriaAnalysis: false,
      scoreBreakdown: false,
      summary: false,
      recommendations: false,
      conclusion: false,
      applicationDetails: false
    })
  }, [])

  // Memoize event handlers
  const handleNewEvaluation = useCallback(() => {
    navigate('/evaluation')
  }, [navigate])

  const handleBackHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleDownloadResults = useCallback(async () => {
    try {
      // Get API base URL from environment
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
      
      // Fetch Markdown report from backend
      const response = await fetch(`${apiBaseUrl}/evaluations/${evaluation.evaluationId}/download`)
      
      if (!response.ok) {
        throw new Error('Failed to download report')
      }
      
      // Get Markdown blob
      const blob = await response.blob()
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `visa-evaluation-${evaluation.evaluationId}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download report:', error)
      alert('Failed to download report. Please try again.')
    }
  }, [evaluation.evaluationId])

  // Memoize formatted date
  const formattedDate = useMemo(
    () => evaluation.results ? new Date(evaluation.results.evaluatedAt).toLocaleString() : '',
    [evaluation.results]
  )

  const hasStructuredData = useMemo(() => ({
    criteriaAnalysis: Boolean(evaluation.results?.criteriaAnalysis && evaluation.results.criteriaAnalysis.length > 0),
    prioritizedRecommendations: Boolean(evaluation.results?.prioritizedRecommendations && evaluation.results.prioritizedRecommendations.length > 0),
    scoreBreakdown: Boolean(evaluation.results?.scoreBreakdown),
    approvalLikelihood: Boolean(evaluation.results?.approvalLikelihood)
  }), [evaluation.results])

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

  // Calculate score color and percentage
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    if (score >= 20) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    if (score >= 20) return 'Needs Work'
    return 'Poor'
  }

  const scorePercentage = evaluation.results.score

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Mobile-Responsive Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
                Evaluation Results
              </h1>
              <p className="text-xs text-blue-100 mt-1 font-mono truncate">
                {evaluation.evaluationId}
              </p>
            </div>
            
            {/* Expand/Collapse Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={expandAll}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-all backdrop-blur-sm border border-white/20"
                title="Expand all sections"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="hidden sm:inline">Expand All</span>
              </button>
              <button
                onClick={collapseAll}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-all backdrop-blur-sm border border-white/20"
                title="Collapse all sections"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                <span className="hidden sm:inline">Collapse All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Score Display with Circular Progress */}
        <div className="px-4 sm:px-8 py-6 sm:py-8 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
          <div className="flex flex-col items-center gap-6">
            {/* Circular Score Indicator */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - scorePercentage / 100)}`}
                    className={`${getScoreColor(evaluation.results.score)} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Score Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-3xl sm:text-4xl font-bold ${getScoreColor(evaluation.results.score)}`}>
                    {evaluation.results.score}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400 font-medium">out of 100</div>
                </div>
              </div>
              
              {/* Score Label */}
              <div className="text-center sm:text-left">
                <div className="text-sm text-gray-500 mb-1">Overall Score</div>
                <div className={`text-2xl sm:text-3xl font-bold ${getScoreColor(evaluation.results.score)}`}>
                  {getScoreLabel(evaluation.results.score)}
                </div>
              </div>
            </div>
            
            {/* Approval Likelihood Badge */}
            {hasStructuredData.approvalLikelihood && evaluation.results.approvalLikelihood && (
              <div className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-5 py-3 sm:py-4 rounded-xl border-2 font-semibold shadow-sm ${getApprovalLikelihoodColor(evaluation.results.approvalLikelihood)}`}>
                <svg 
                  className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" 
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
                <div className="text-center sm:text-left">
                  <div className="text-xs opacity-75 mb-0.5">Approval Likelihood</div>
                  <div className="text-base sm:text-lg font-bold">{evaluation.results.approvalLikelihood}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Sections */}
        <div className="divide-y divide-gray-200">
          {/* Criteria Analysis Section */}
          {hasStructuredData.criteriaAnalysis && evaluation.results.criteriaAnalysis && (
            <CollapsibleSection
              title="Criteria Analysis"
              icon="📊"
              isExpanded={expandedSections.criteriaAnalysis}
              onToggle={() => toggleSection('criteriaAnalysis')}
              badge={`${evaluation.results.criteriaAnalysis.length} criteria`}
            >
              <CriteriaAnalysisSection criteriaAnalysis={evaluation.results.criteriaAnalysis} />
            </CollapsibleSection>
          )}
          
          {/* Score Breakdown Section */}
          {hasStructuredData.scoreBreakdown && evaluation.results.scoreBreakdown && (
            <CollapsibleSection
              title="Score Breakdown"
              icon="🔢"
              isExpanded={expandedSections.scoreBreakdown}
              onToggle={() => toggleSection('scoreBreakdown')}
              badge={evaluation.results.scoreBreakdown.penalties.length > 0 ? `${evaluation.results.scoreBreakdown.penalties.length} penalties` : undefined}
            >
              <ScoreBreakdownSection scoreBreakdown={evaluation.results.scoreBreakdown} />
            </CollapsibleSection>
          )}
          
          {/* Summary Section */}
          <CollapsibleSection
            title="Evaluation Summary"
            icon="📝"
            isExpanded={expandedSections.summary}
            onToggle={() => toggleSection('summary')}
          >
            <SummarySection 
              summary={evaluation.results.summary}
              visaType={evaluation.visaApplication.visaType}
              country={evaluation.visaApplication.country}
            />
          </CollapsibleSection>

          {/* Recommendations Section */}
          {(hasStructuredData.prioritizedRecommendations || (evaluation.results.recommendations && evaluation.results.recommendations.length > 0)) && (
            <CollapsibleSection
              title="Recommendations"
              icon="💡"
              isExpanded={expandedSections.recommendations}
              onToggle={() => toggleSection('recommendations')}
              badge={hasStructuredData.prioritizedRecommendations 
                ? `${evaluation.results.prioritizedRecommendations?.length} actions`
                : `${evaluation.results.recommendations?.length} items`
              }
            >
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
            </CollapsibleSection>
          )}

          {/* Conclusion Section */}
          {evaluation.results.conclusion && (
            <CollapsibleSection
              title="Conclusion"
              icon="✅"
              isExpanded={expandedSections.conclusion}
              onToggle={() => toggleSection('conclusion')}
            >
              <ConclusionSection 
                conclusion={evaluation.results.conclusion}
                score={evaluation.results.score}
              />
            </CollapsibleSection>
          )}

          {/* Application Details Section */}
          <CollapsibleSection
            title="Application Details"
            icon="📋"
            isExpanded={expandedSections.applicationDetails}
            onToggle={() => toggleSection('applicationDetails')}
          >
            <div className="p-6 bg-gray-50">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Applicant Name</dt>
                  <dd className="text-base font-semibold text-gray-900 break-words">{evaluation.userInfo.name}</dd>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Email Address</dt>
                  <dd className="text-base font-semibold text-gray-900 break-all">{evaluation.userInfo.email}</dd>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Target Country</dt>
                  <dd className="text-base font-semibold text-gray-900">{evaluation.visaApplication.country}</dd>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Visa Type</dt>
                  <dd className="text-base font-semibold text-gray-900">{evaluation.visaApplication.visaType}</dd>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Documents Submitted</dt>
                  <dd className="text-base font-semibold text-gray-900">{evaluation.documents.length} files</dd>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <dt className="text-sm font-medium text-gray-500 mb-1">Evaluated At</dt>
                  <dd className="text-base font-semibold text-gray-900">
                    {formattedDate}
                  </dd>
                </div>
              </dl>
            </div>
          </CollapsibleSection>
        </div>

        {/* Action Buttons */}
        <div className="p-6 sm:p-8 bg-gray-50 rounded-b-xl">
          <ActionButtons 
            onNewEvaluation={handleNewEvaluation}
            onBackHome={handleBackHome}
            onDownloadResults={handleDownloadResults}
          />
        </div>
      </div>
    </div>
  )
})
