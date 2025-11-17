import { useState, useEffect } from 'react'
import { visaTypesApi } from '../api/visaTypes'
import type { VisaType, Country } from '../api/types'

/**
 * Custom hook for fetching visa types and countries
 * @param country - Optional country to fetch visa types for
 * @returns Object containing visaTypes, countries, loading state, and error
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
