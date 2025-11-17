import React, { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AppContextType {
  loading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => {
    setError(null)
  }

  return (
    <AppContext.Provider value={{
      loading,
      error,
      setLoading,
      setError,
      clearError
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
