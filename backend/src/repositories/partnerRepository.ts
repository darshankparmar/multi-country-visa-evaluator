import { Partner } from '../models/Partner';
import { IPartner } from '../types/partner.types';
import mongoose from 'mongoose';

/**
 * Options for listing partners
 */
export interface ListPartnersOptions {
  activeOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Repository for Partner data access
 * Provides type-safe methods for CRUD operations on partners
 */
export class PartnerRepository {
  /**
   * Create a new partner record
   * @param data - Partner data to create
   * @returns Created partner document
   */
  async create(data: Partial<IPartner>): Promise<IPartner> {
    const partner = new Partner(data);
    return await partner.save();
  }

  /**
   * Find partner by API key
   * @param apiKey - Partner API key
   * @returns Partner document or null if not found
   */
  async findByApiKey(apiKey: string): Promise<IPartner | null> {
    return await Partner.findOne({ apiKey }).exec();
  }

  /**
   * Find partner by MongoDB _id
   * @param id - MongoDB ObjectId or string
   * @returns Partner document or null if not found
   */
  async findById(id: mongoose.Types.ObjectId | string): Promise<IPartner | null> {
    return await Partner.findById(id).exec();
  }

  /**
   * Find partner by email
   * @param email - Partner email address
   * @returns Partner document or null if not found
   */
  async findByEmail(email: string): Promise<IPartner | null> {
    return await Partner.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * List all partners with optional filtering
   * @param options - List options including active filter and sorting
   * @returns Array of partner documents
   */
  async list(options: ListPartnersOptions = {}): Promise<IPartner[]> {
    const {
      activeOnly = false,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query: any = {};

    // Filter for active partners only if specified
    if (activeOnly) {
      query.active = true;
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    return await Partner.find(query)
      .sort({ [sortBy]: sortDirection })
      .exec();
  }

  /**
   * Update partner active status
   * @param id - Partner MongoDB ObjectId or string
   * @param active - New active status (true/false)
   * @returns Updated partner document or null if not found
   */
  async updateStatus(
    id: mongoose.Types.ObjectId | string,
    active: boolean
  ): Promise<IPartner | null> {
    return await Partner.findByIdAndUpdate(
      id,
      { $set: { active } },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Update partner information
   * @param id - Partner MongoDB ObjectId or string
   * @param data - Partial partner data to update
   * @returns Updated partner document or null if not found
   */
  async update(
    id: mongoose.Types.ObjectId | string,
    data: Partial<IPartner>
  ): Promise<IPartner | null> {
    return await Partner.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Delete partner by ID
   * @param id - Partner MongoDB ObjectId or string
   * @returns Deleted partner document or null if not found
   */
  async delete(id: mongoose.Types.ObjectId | string): Promise<IPartner | null> {
    return await Partner.findByIdAndDelete(id).exec();
  }

  /**
   * Check if API key exists and is active
   * @param apiKey - Partner API key
   * @returns True if key exists and is active, false otherwise
   */
  async isApiKeyValid(apiKey: string): Promise<boolean> {
    const partner = await Partner.findOne({ apiKey, active: true }).exec();
    return partner !== null;
  }

  /**
   * Get active partners only
   * @returns Array of active partner documents
   */
  async getActivePartners(): Promise<IPartner[]> {
    return await this.list({ activeOnly: true });
  }
}
