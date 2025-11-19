import React, { useMemo } from 'react'
import type { ParsedDocument } from '../../api/types'

interface ValidationResult {
  criterion: string
  met: boolean
  score: number
  maxScore: number
  details: string
  isCritical: boolean
  evidence?: string[]
  sourceDocument?: string
}

interface DocumentsAnalyzedSectionProps {
  documents: Array<{
    filename: string
    originalName: string
    uploadedAt: string
    extractedText?: string
  }>
  parsedDocuments?: ParsedDocument[]
  validationResults?: ValidationResult[]
}

/**
 * Component to display analyzed documents with parse status and evidence
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
export const DocumentsAnalyzedSection: React.FC<DocumentsAnalyzedSectionProps> = ({
  documents,
  parsedDocuments,
  validationResults
}) => {
  // Subtask 12.3: Highlight documents with key evidence
  // Map which documents contain key evidence from validation results
  const documentEvidence = useMemo(() => {
    const evidenceMap = new Map<string, Set<string>>()
    
    if (validationResults) {
      validationResults.forEach(result => {
        if (result.sourceDocument && result.evidence && result.evidence.length > 0) {
          if (!evidenceMap.has(result.sourceDocument)) {
            evidenceMap.set(result.sourceDocument, new Set())
          }
          // Add the criterion name to the evidence set for this document
          evidenceMap.get(result.sourceDocument)?.add(result.criterion)
        }
      })
    }
    
    return evidenceMap
  }, [validationResults])

  // Get document type from filename extension
  const getDocumentType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase()
    return ext || 'UNKNOWN'
  }

  // Subtask 12.2: Get parse status icon
  const getStatusIcon = (success: boolean) => {
    if (success) {
      return (
        <svg 
          className="w-5 h-5 text-green-600" 
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
      )
    } else {
      return (
        <svg 
          className="w-5 h-5 text-red-600" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293z" 
            clipRule="evenodd" 
          />
        </svg>
      )
    }
  }

  // Subtask 12.4: Get re-upload suggestion based on error
  const getReuploadSuggestion = (error?: string): string => {
    if (!error) return ''
    
    const errorLower = error.toLowerCase()
    
    if (errorLower.includes('password') || errorLower.includes('encrypted')) {
      return 'Please remove password protection and re-upload'
    } else if (errorLower.includes('corrupt') || errorLower.includes('invalid')) {
      return 'File may be corrupted. Please re-upload a valid document'
    } else if (errorLower.includes('format') || errorLower.includes('unsupported')) {
      return 'Unsupported format. Please convert to PDF, DOCX, or TXT'
    } else if (errorLower.includes('size') || errorLower.includes('large')) {
      return 'File too large. Please reduce file size and re-upload'
    } else if (errorLower.includes('empty') || errorLower.includes('no text')) {
      return 'No text found. Please ensure document contains readable text'
    } else {
      return 'Please check the file and try re-uploading'
    }
  }

  // Merge documents with parsed document information
  const enrichedDocuments = useMemo(() => {
    return documents.map(doc => {
      const parsed = parsedDocuments?.find(
        pd => pd.filename === doc.filename || pd.originalName === doc.originalName
      )
      
      const docType = parsed?.documentType || getDocumentType(doc.originalName)
      const success = parsed?.success ?? (doc.extractedText ? true : false)
      const error = parsed?.error
      const evidence = documentEvidence.get(doc.filename) || documentEvidence.get(doc.originalName)
      
      return {
        ...doc,
        documentType: docType,
        success,
        error,
        evidence: evidence ? Array.from(evidence) : []
      }
    })
  }, [documents, parsedDocuments, documentEvidence])

  if (!documents || documents.length === 0) {
    return null
  }

  return (
    <div className="mt-6 sm:mt-8">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
        Documents Analyzed
      </h2>
      
      {/* Subtask 12.1: Display list of all uploaded documents */}
      <div className="space-y-3">
        {enrichedDocuments.map((doc, index) => (
          <div 
            key={index}
            className={`border rounded-lg p-4 transition-all ${
              doc.success 
                ? doc.evidence.length > 0
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white'
                : 'border-red-300 bg-red-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Subtask 12.2: Display parse status with icons */}
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(doc.success)}
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Document name and type */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 break-all">
                    {doc.originalName}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded border border-gray-300">
                    {doc.documentType}
                  </span>
                  {doc.success && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      Parsed Successfully
                    </span>
                  )}
                  {!doc.success && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                      Parse Failed
                    </span>
                  )}
                </div>
                
                {/* Subtask 12.3: Show which evidence was found in each document */}
                {doc.success && doc.evidence.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-green-700 mb-1">
                      Key Evidence Found:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.evidence.map((criterion, i) => (
                        <span 
                          key={i}
                          className="px-2 py-1 text-xs font-medium bg-green-200 text-green-900 rounded"
                        >
                          {criterion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Subtask 12.2: Show error reason for failed parses */}
                {!doc.success && doc.error && (
                  <div className="mb-2">
                    <p className="text-sm text-red-700">
                      <strong className="font-semibold">Error:</strong> {doc.error}
                    </p>
                  </div>
                )}
                
                {/* Subtask 12.4: Add re-upload suggestions */}
                {!doc.success && (
                  <div className="mt-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <svg 
                        className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-800 mb-1">
                          Suggestion:
                        </p>
                        <p className="text-sm text-yellow-700">
                          {getReuploadSuggestion(doc.error)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Upload timestamp */}
                <p className="text-xs text-gray-500 mt-2">
                  Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Subtask 12.4: Provide guidance on document format requirements */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          Document Format Guidelines:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Supported formats: PDF, DOCX, DOC, TXT</li>
          <li>Remove password protection before uploading</li>
          <li>Ensure documents contain readable text (not just images)</li>
          <li>Maximum file size: 10MB per document</li>
          <li>For best results, use clear, well-formatted documents</li>
        </ul>
      </div>
    </div>
  )
}
