import React from 'react'
import { Button } from '../common/Button'

interface ActionButtonsProps {
  onNewEvaluation: () => void
  onBackHome: () => void
  onDownloadResults?: () => void
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onNewEvaluation, 
  onBackHome,
  onDownloadResults 
}) => {
  return (
    <div className="mt-8 pt-6 border-t">
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={onNewEvaluation}
          size="lg"
          className="w-full sm:w-auto"
        >
          New Evaluation
        </Button>
        
        <Button 
          onClick={onBackHome}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          Back to Home
        </Button>
        
        {onDownloadResults && (
          <Button 
            onClick={onDownloadResults}
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto"
          >
            Download Results
          </Button>
        )}
      </div>
    </div>
  )
}
