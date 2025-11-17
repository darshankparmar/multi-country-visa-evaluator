export interface EvaluationRequest {
  name: string
  email: string
  country: string
  visaType: string
  documents: File[]
}

export interface EvaluationResponse {
  status: 'success'
  data: {
    evaluationId: string
    score: number
    summary: string
    userInfo: {
      name: string
      email: string
    }
    visaApplication: {
      country: string
      visaType: string
    }
    createdAt: string
  }
}

export interface EvaluationDetail {
  evaluationId: string
  userInfo: {
    name: string
    email: string
  }
  visaApplication: {
    country: string
    visaType: string
  }
  documents: Array<{
    filename: string
    originalName: string
    uploadedAt: string
  }>
  results: {
    score: number
    summary: string
    evaluatedAt: string
  }
  createdAt: string
  updatedAt: string
}

export interface VisaType {
  _id: string
  country: string
  visaType: string
  requiredDocuments: string[]
  description?: string
  processingTime?: string
  active: boolean
}

export interface Country {
  name: string
}
