import { Evaluation } from '../models/Evaluation';
import { IEvaluation } from '../types/evaluation.types';
import mongoose from 'mongoose';

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Filter options for evaluation queries
 */
export interface EvaluationFilters {
  partnerId?: mongoose.Types.ObjectId | string;
  email?: string;
  country?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Repository for Evaluation data access
 * Provides type-safe methods for CRUD operations on evaluations
 */
export class EvaluationRepository {
  /**
   * Create a new evaluation record
   * @param data - Evaluation data to create
   * @returns Created evaluation document
   */
  async create(data: Partial<IEvaluation>): Promise<IEvaluation> {
    const evaluation = new Evaluation(data);
    return await evaluation.save();
  }

  /**
   * Find evaluation by unique evaluation ID
   * @param evaluationId - Unique evaluation identifier
   * @returns Evaluation document or null if not found
   */
  async findById(evaluationId: string): Promise<IEvaluation | null> {
    return await Evaluation.findOne({ evaluationId }).exec();
  }

  /**
   * Find evaluations by user email
   * @param email - User email address
   * @returns Array of evaluation documents
   */
  async findByEmail(email: string): Promise<IEvaluation[]> {
    return await Evaluation.find({ 'userInfo.email': email.toLowerCase() })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find evaluations by partner ID
   * @param partnerId - Partner ObjectId or string
   * @returns Array of evaluation documents
   */
  async findByPartnerId(partnerId: mongoose.Types.ObjectId | string): Promise<IEvaluation[]> {
    return await Evaluation.find({ partnerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Update evaluation results with score and summary
   * @param evaluationId - Unique evaluation identifier
   * @param score - Evaluation score (0-100)
   * @param summary - Evaluation summary text
   * @returns Updated evaluation document or null if not found
   */
  async updateResults(
    evaluationId: string,
    score: number,
    summary: string
  ): Promise<IEvaluation | null> {
    return await Evaluation.findOneAndUpdate(
      { evaluationId },
      {
        $set: {
          results: {
            score,
            summary,
            evaluatedAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * List evaluations with pagination and filtering
   * @param filters - Optional filters for querying evaluations
   * @param options - Pagination options
   * @returns Paginated evaluation results
   */
  async list(
    filters: EvaluationFilters = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<IEvaluation>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Build query filter
    const query: any = {};

    if (filters.partnerId) {
      query.partnerId = filters.partnerId;
    }

    if (filters.email) {
      query['userInfo.email'] = filters.email.toLowerCase();
    }

    if (filters.country) {
      query['visaApplication.country'] = filters.country;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [data, total] = await Promise.all([
      Evaluation.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .exec(),
      Evaluation.countDocuments(query).exec()
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find evaluation by MongoDB _id
   * @param id - MongoDB ObjectId
   * @returns Evaluation document or null if not found
   */
  async findByMongoId(id: mongoose.Types.ObjectId | string): Promise<IEvaluation | null> {
    return await Evaluation.findById(id).exec();
  }

  /**
   * Delete evaluation by evaluation ID
   * @param evaluationId - Unique evaluation identifier
   * @returns Deleted evaluation document or null if not found
   */
  async delete(evaluationId: string): Promise<IEvaluation | null> {
    return await Evaluation.findOneAndDelete({ evaluationId }).exec();
  }
}
