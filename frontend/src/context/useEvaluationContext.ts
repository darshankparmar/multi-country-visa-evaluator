import { useContext } from 'react'
import { EvaluationContext } from './evaluationContextDefinition'

export const useEvaluationContext = () => {
  const context = useContext(EvaluationContext)
  if (!context) {
    throw new Error('useEvaluationContext must be used within EvaluationProvider')
  }
  return context
}
