import { Document, Types } from 'mongoose';

/**
 * Interface for Partner document in MongoDB
 */
export interface IPartner extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  apiKey: string;
  contactInfo?: {
    phone?: string;
    website?: string;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating a new partner
 */
export interface CreatePartnerRequest {
  name: string;
  email: string;
  contactInfo?: {
    phone?: string;
    website?: string;
  };
}

/**
 * DTO for partner response
 */
export interface PartnerResponse {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  contactInfo?: {
    phone?: string;
    website?: string;
  };
  active: boolean;
  createdAt: Date;
}

/**
 * DTO for updating partner status
 */
export interface UpdatePartnerStatusRequest {
  active: boolean;
}

/**
 * DTO for partner list response
 */
export interface PartnerListResponse {
  partners: PartnerResponse[];
  total: number;
  page: number;
  limit: number;
}
