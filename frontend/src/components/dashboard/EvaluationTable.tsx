import React, { useState, useMemo } from 'react'
import { Button } from '../common/Button'
import type { EvaluationDetail } from '../../api/types'

interface EvaluationTableProps {
  evaluations: EvaluationDetail[]
  onExport: () => void
}

type SortField = 'date' | 'score' | 'name'
type SortDirection = 'asc' | 'desc'

export const EvaluationTable: React.FC<EvaluationTableProps> = ({ evaluations, onExport }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Sort evaluations
  const sortedEvaluations = useMemo(() => {
    const sorted = [...evaluations]
    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'score':
          comparison = (a.results?.score || 0) - (b.results?.score || 0)
          break
        case 'name':
          comparison = a.userInfo.name.localeCompare(b.userInfo.name)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [evaluations, sortField, sortDirection])

  // Paginate evaluations
  const paginatedEvaluations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedEvaluations.slice(startIndex, startIndex + pageSize)
  }, [sortedEvaluations, currentPage, pageSize])

  const totalPages = Math.ceil(sortedEvaluations.length / pageSize)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  if (evaluations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">No evaluations found</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with Export Button */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Evaluations</h3>
        <Button onClick={onExport} variant="outline" size="sm" className="w-full sm:w-auto flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visa Type
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center space-x-1">
                  <span>Score</span>
                  <SortIcon field="score" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <SortIcon field="date" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedEvaluations.map((evaluation) => (
              <tr key={evaluation.evaluationId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {evaluation.evaluationId.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {evaluation.userInfo.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {evaluation.userInfo.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {evaluation.visaApplication.country}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {evaluation.visaApplication.visaType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (evaluation.results?.score || 0) >= 70
                        ? 'bg-green-100 text-green-800'
                        : (evaluation.results?.score || 0) >= 50
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {evaluation.results?.score || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(evaluation.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
        {/* Mobile Layout */}
        <div className="flex flex-col gap-4 sm:hidden">
          {/* Page Size Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-xs text-gray-700 whitespace-nowrap">
                Show:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border border-gray-300 rounded-md py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <span className="text-xs text-gray-700 whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          {/* Pagination Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="flex-1 text-xs py-2"
            >
              First
            </Button>
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="flex-1 text-xs py-2"
            >
              Prev
            </Button>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="flex-1 text-xs py-2"
            >
              Next
            </Button>
            <Button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="flex-1 text-xs py-2"
            >
              Last
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize-desktop" className="text-sm text-gray-700 whitespace-nowrap">
              Show:
            </label>
            <select
              id="pageSize-desktop"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="border border-gray-300 rounded-md py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700 whitespace-nowrap">
              per page
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                First
              </Button>
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
              <Button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
