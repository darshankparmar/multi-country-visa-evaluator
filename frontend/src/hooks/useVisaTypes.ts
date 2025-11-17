import { useState, useEffect } from 'react'
import { visaTypesApi } from '../api/visaTypes'
import type { VisaType, Country } from '../api/types'

/**
 * Custom hook for fetching visa types and countries
 * 
 * Automatically fetches data based on the country parameter:
 * - If country is provided: fetches visa types for that country
 * - If country is not provided: fetches list of all available countries
 * 
 * Results are cached by the API layer to minimize redundant requests.
 * 
 * @param {string} [country] - Optional country name to fetch visa types for
 * @returns {Object} Hook state and data
 * @returns {VisaType[]} returns.visaTypes - Array of visa types (when country is provided)
 * @returns {Country[]} returns.countries - Array of countries (when country is not provided)
 * @returns {boolean} returns.loading - Loading state indicator
 * @returns {string | null} returns.error - Error message if fetch fails
 * 
 * @example
 * ```typescript
 * // Fetch all countries
 * const { countries, loading, error } = useVisaTypes()
 * 
 * // Fetch visa types for a specific country
 * const { visaTypes, loading, error } = useVisaTypes('United States')
 * 
 * if (loading) return <LoadingSpinner />
 * if (error) return <ErrorMessage message={error} />
 * ```
 */
export const useVisaTypes = (country?: string) => {
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        if (country) {
          // Fetch visa types for specific country
          const data = await visaTypesApi.getVisaTypesByCountry(country)
          setVisaTypes(data)
        } else {
          // Fetch all countries when no country is provided
          const countriesData = await visaTypesApi.getCountries()
          setCountries(countriesData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [country])

  return { visaTypes, countries, loading, error }
}
