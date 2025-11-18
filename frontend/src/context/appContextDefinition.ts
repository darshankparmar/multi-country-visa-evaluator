import { createContext } from 'react'

export interface AppContextType {
  loading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const AppContext = createContext<AppContextType | undefined>(undefined)
