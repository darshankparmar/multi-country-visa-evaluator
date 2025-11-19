import { Evaluation } from '../models/Evaluation';
import { IEvaluation } from '../types/evaluation.types';
import mongoose from 'mongoose';
import { sanitizeEmail, sanitizeCountry } from '../utils/sanitization';
import { logger } from '../config/logger';

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
   * @param recommendations - Optional array of recommendations
   * @param conclusion - Optional conclusion text
   * @returns Updated evaluation document or null if not found
   */
  async updateResults(
    evaluationId: string,
    score: number,
    summary: string,
    recommendations?: string[],
    conclusion?: string
  ): Promise<IEvaluation | null> {
    const results: any = {
      score,
      summary,
      evaluatedAt: new Date()
    };

    // Only include recommendations and conclusion if provided
    if (recommendations !== undefined) {
      results.recommendations = recommendations;
    }
    if (conclusion !== undefined) {
      results.conclusion = conclusion;
    }

    return await Evaluation.findOneAndUpdate(
      { evaluationId },
      {
        $set: {
          results
        }
      },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Update evaluation results with structured analysis
   * @param evaluationId - Unique evaluation identifier
   * @param results - Complete evaluation results including structured analysis
   * @returns Updated evaluation document or null if not found
   */
  async updateStructuredResults(
    evaluationId: string,
    results: {
      score: number;
      summary: string;
      recommendations?: string[];
      conclusion?: string;
      criteriaAnalysis?: any[];
      prioritizedRecommendations?: any[];
      scoreBreakdown?: any;
      approvalLikelihood?: string;
      validationResults?: any[];
    }
  ): Promise<IEvaluation | null> {
    const updateData: any = {
      score: results.score,
      summary: results.summary,
      evaluatedAt: new Date()
    };

    // Include all optional fields if provided
    if (results.recommendations !== undefined) {
      updateData.recommendations = results.recommendations;
    }
    if (results.conclusion !== undefined) {
      updateData.conclusion = results.conclusion;
    }
    if (results.criteriaAnalysis !== undefined) {
      updateData.criteriaAnalysis = results.criteriaAnalysis;
    }
    if (results.prioritizedRecommendations !== undefined) {
      updateData.prioritizedRecommendations = results.prioritizedRecommendations;
    }
    if (results.scoreBreakdown !== undefined) {
      updateData.scoreBreakdown = results.scoreBreakdown;
    }
    if (results.approvalLikelihood !== undefined) {
      updateData.approvalLikelihood = results.approvalLikelihood;
    }
    if (results.validationResults !== undefined) {
      updateData.validationResults = results.validationResults;
    }

    return await Evaluation.findOneAndUpdate(
      { evaluationId },
      {
        $set: {
          results: updateData
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

    // Build query filter with sanitization to prevent NoSQL injection
    const query: any = {};

    if (filters.partnerId) {
      // Validate partnerId is a valid ObjectId
      try {
        query.partnerId = new mongoose.Types.ObjectId(filters.partnerId.toString());
      } catch (error) {
        logger.warn('Invalid partnerId format', { partnerId: filters.partnerId });
        throw new Error('Invalid partnerId format');
      }
    }

    if (filters.email) {
      // Sanitize email to prevent injection
      try {
        query['userInfo.email'] = sanitizeEmail(filters.email);
      } catch (error) {
        logger.warn('Invalid email format in filter', { email: filters.email });
        throw new Error('Invalid email format');
      }
    }

    if (filters.country) {
      // Sanitize country to prevent injection
      try {
        query['visaApplication.country'] = sanitizeCountry(filters.country);
      } catch (error) {
        logger.warn('Invalid country format in filter', { country: filters.country });
        throw new Error('Invalid country format');
      }
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        // Ensure startDate is a valid Date object
        if (!(filters.startDate instanceof Date) || isNaN(filters.startDate.getTime())) {
          throw new Error('Invalid startDate format');
        }
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        // Ensure endDate is a valid Date object
        if (!(filters.endDate instanceof Date) || isNaN(filters.endDate.getTime())) {
          throw new Error('Invalid endDate format');
        }
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
