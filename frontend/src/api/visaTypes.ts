import { apiClient } from './client'
import type { VisaType, Country } from './types'

// In-memory cache for visa types
const cache = new Map<string, VisaType[]>()

export const visaTypesApi = {
  /**
   * Get all visa types (cached)
   */
  async getAllVisaTypes(): Promise<VisaType[]> {
    const cacheKey = 'all'
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!
    }

    const data = await apiClient.get<VisaType[]>('/visa-types')
    cache.set(cacheKey, data)
    return data
  },

  /**
   * Get visa types by country (cached)
   */
  async getVisaTypesByCountry(country: string): Promise<VisaType[]> {
    if (cache.has(country)) {
      return cache.get(country)!
    }

    const data = await apiClient.get<VisaType[]>(`/visa-types/${encodeURIComponent(country)}`)
    cache.set(country, data)
    return data
  },

  /**
   * Get unique countries from all visa types
   */
  async getCountries(): Promise<Country[]> {
    const visaTypes = await this.getAllVisaTypes()
    const uniqueCountries = [...new Set(visaTypes.map(vt => vt.country))]
    return uniqueCountries.map(name => ({ name }))
  }
}
