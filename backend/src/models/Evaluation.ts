import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IEvaluation } from '../types/evaluation.types';
import { SCORES } from '../constants';

/**
 * Mongoose schema for Evaluation
 * Defines structure for visa evaluation records with user info, documents, and results
 */
const evaluationSchema = new Schema<IEvaluation>(
  {
    evaluationId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
      index: true
    },
    userInfo: {
      name: {
        type: String,
        required: [true, 'User name is required'],
        trim: true
      },
      email: {
        type: String,
        required: [true, 'User email is required'],
        trim: true,
        lowercase: true,
        index: true,
        validate: {
          validator: function(email: string) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          },
          message: 'Invalid email format'
        }
      }
    },
    visaApplication: {
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true
      },
      visaType: {
        type: String,
        required: [true, 'Visa type is required'],
        trim: true
      }
    },
    documents: [
      {
        filename: {
          type: String,
          required: true
        },
        originalName: {
          type: String,
          required: true
        },
        path: {
          type: String,
          required: true
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        },
        extractedText: {
          type: String,
          required: false
        }
      }
    ],
    results: {
      score: {
        type: Number,
        min: SCORES.MIN_SCORE,
        max: SCORES.MAX_SCORE
      },
      summary: {
        type: String
      },
      evaluatedAt: {
        type: Date
      },
      recommendations: {
        type: [String],
        required: false
      },
      conclusion: {
        type: String,
        required: false
      },
      criteriaAnalysis: {
        type: [{
          name: { type: String, required: true },
          rating: { 
            type: String, 
            enum: ['STRONG', 'GOOD', 'MODERATE', 'WEAK', 'CRITICAL_GAP'],
            required: true 
          },
          evidence: { type: [String], default: [] },
          gaps: { type: [String], default: [] },
          recommendation: { type: String, required: false },
          isCritical: { type: Boolean, required: true }
        }],
        required: false
      },
      prioritizedRecommendations: {
        type: [{
          priority: { 
            type: String, 
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            required: true 
          },
          text: { type: String, required: true },
          relatedCriterion: { type: String, required: false }
        }],
        required: false
      },
      scoreBreakdown: {
        type: {
          baseScore: { type: Number, required: true },
          penalties: {
            type: [{
              requirement: { type: String, required: true },
              points: { type: Number, required: true },
              reason: { type: String, required: true }
            }],
            default: []
          },
          totalPenalty: { type: Number, required: true },
          adjustedScore: { type: Number, required: true },
          breakdown: {
            type: [{
              criterion: { type: String, required: true },
              points: { type: Number, required: true },
              maxPoints: { type: Number, required: true },
              percentage: { type: Number, required: true }
            }],
            default: []
          }
        },
        required: false
      },
      approvalLikelihood: {
        type: String,
        enum: ['Strong', 'Good', 'Moderate', 'Needs Improvement', 'Low', 'Not Viable'],
        required: false
      },
      validationResults: {
        type: [{
          criterion: { type: String, required: true },
          met: { type: Boolean, required: true },
          score: { type: Number, required: true },
          maxScore: { type: Number, required: true },
          details: { type: String, required: true },
          isCritical: { type: Boolean, required: true }
        }],
        required: false
      }
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'evaluations'
  }
);

// Index on email for user lookup
evaluationSchema.index({ 'userInfo.email': 1 });

// Index on partnerId for partner-specific queries
evaluationSchema.index({ partnerId: 1 });

// Index on createdAt for date-based queries and sorting
evaluationSchema.index({ createdAt: -1 });

// Compound index for partner + date queries
evaluationSchema.index({ partnerId: 1, createdAt: -1 });

/**
 * Evaluation model
 * Used for storing and querying visa evaluation records
 */
export const Evaluation = mongoose.model<IEvaluation>('Evaluation', evaluationSchema);
