import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IEvaluation } from '../types/evaluation.types';

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
        }
      }
    ],
    results: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      summary: {
        type: String
      },
      evaluatedAt: {
        type: Date
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
