import React, { useState } from 'react'
import type { ReactNode } from 'react'
import { AppContext } from './appContextDefinition'

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
