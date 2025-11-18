import React, { useState } from 'react'
import { Input } from '../common/Input'
import { Button } from '../common/Button'

export interface FilterState {
  dateFrom?: string
  dateTo?: string
  country?: string
  visaType?: string
  minScore?: number
  maxScore?: number
  search?: string
}

interface EvaluationFiltersProps {
  onFilterChange: (filters: FilterState) => void
  countries: string[]
  visaTypes: string[]
}

export const EvaluationFilters: React.FC<EvaluationFiltersProps> = ({
  onFilterChange,
  countries,
  visaTypes
}) => {
  const [filters, setFilters] = useState<FilterState>({})

  const handleChange = (key: keyof FilterState, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    setFilters({})
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '')

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filter Evaluations</h2>
        {hasActiveFilters && (
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
          >
            Reset Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
            Date From
          </label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
            Date To
          </label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleChange('dateTo', e.target.value)}
          />
        </div>

        {/* Country Filter */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <select
            id="country"
            value={filters.country || ''}
            onChange={(e) => handleChange('country', e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 px-3 text-base sm:text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* Visa Type Filter */}
        <div>
          <label htmlFor="visaType" className="block text-sm font-medium text-gray-700 mb-1">
            Visa Type
          </label>
          <select
            id="visaType"
            value={filters.visaType || ''}
            onChange={(e) => handleChange('visaType', e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 px-3 text-base sm:text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Visa Types</option>
            {visaTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Score Range */}
        <div>
          <label htmlFor="minScore" className="block text-sm font-medium text-gray-700 mb-1">
            Min Score
          </label>
          <Input
            id="minScore"
            type="number"
            min="0"
            max="100"
            value={filters.minScore || ''}
            onChange={(e) => handleChange('minScore', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="0"
          />
        </div>

        <div>
          <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700 mb-1">
            Max Score
          </label>
          <Input
            id="maxScore"
            type="number"
            min="0"
            max="100"
            value={filters.maxScore || ''}
            onChange={(e) => handleChange('maxScore', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="100"
          />
        </div>
      </div>

      {/* Search */}
      <div className="mt-4">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
          Search by Name or Email
        </label>
        <Input
          id="search"
          type="text"
          value={filters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          placeholder="Search evaluations..."
        />
      </div>
    </div>
  )
}
