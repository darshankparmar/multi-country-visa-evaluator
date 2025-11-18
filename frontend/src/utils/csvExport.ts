import type { EvaluationDetail } from '../api/types'

/**
 * Export evaluations to CSV format and trigger download
 */
export const exportEvaluationsToCSV = (evaluations: EvaluationDetail[]) => {
  // Define CSV headers
  const headers = [
    'Evaluation ID',
    'Name',
    'Email',
    'Country',
    'Visa Type',
    'Score',
    'Summary',
    'Recommendations',
    'Conclusion',
    'Date'
  ]

  // Convert evaluations to CSV rows
  const rows = evaluations.map(evaluation => {
    const recommendations = evaluation.results?.recommendations
      ? evaluation.results.recommendations.join('; ')
      : ''

    return [
      evaluation.evaluationId,
      evaluation.userInfo.name,
      evaluation.userInfo.email,
      evaluation.visaApplication.country,
      evaluation.visaApplication.visaType,
      evaluation.results?.score?.toString() || '',
      evaluation.results?.summary || '',
      recommendations,
      evaluation.results?.conclusion || '',
      new Date(evaluation.createdAt).toISOString()
    ]
  })

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSVValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSVValue).join(','))
  ].join('\n')

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `evaluations-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
