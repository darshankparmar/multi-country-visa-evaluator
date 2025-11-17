import { Document } from 'mongoose';

/**
 * Enum for document types required for visa applications
 */
export enum DocumentType {
  RESUME = 'resume',
  PERSONAL_STATEMENT = 'personal_statement',
  POLICE_REPORT = 'police_report',
  EMPLOYMENT_CONTRACT = 'employment_contract',
  PASSPORT_COPY = 'passport_copy',
  EDUCATION_CERTIFICATES = 'education_certificates',
  REFERENCE_LETTERS = 'reference_letters',
  FINANCIAL_DOCUMENTS = 'financial_documents'
}

/**
 * Interface for VisaType document in MongoDB
 */
export interface IVisaType extends Document {
  country: string;
  visaType: string;
  requiredDocuments: DocumentType[];
  description?: string;
  processingTime?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating a new visa type
 */
export interface CreateVisaTypeRequest {
  country: string;
  visaType: string;
  requiredDocuments: DocumentType[];
  description?: string;
  processingTime?: string;
}

/**
 * DTO for visa type response
 */
export interface VisaTypeResponse {
  id: string;
  country: string;
  visaType: string;
  requiredDocuments: DocumentType[];
  description?: string;
  processingTime?: string;
  active: boolean;
}

/**
 * DTO for updating visa type
 */
export interface UpdateVisaTypeRequest {
  requiredDocuments?: DocumentType[];
  description?: string;
  processingTime?: string;
  active?: boolean;
}
