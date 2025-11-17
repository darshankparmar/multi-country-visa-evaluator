import mongoose, { Schema } from 'mongoose';
import { IVisaType, DocumentType } from '../types/visaType.types';

/**
 * Mongoose schema for VisaType
 * Defines structure for visa type configurations with required documents
 */
const visaTypeSchema = new Schema<IVisaType>(
  {
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      index: true
    },
    visaType: {
      type: String,
      required: [true, 'Visa type is required'],
      trim: true
    },
    requiredDocuments: {
      type: [String],
      required: [true, 'Required documents list is required'],
      enum: Object.values(DocumentType),
      validate: {
        validator: function(documents: string[]) {
          return documents.length > 0;
        },
        message: 'At least one required document must be specified'
      }
    },
    description: {
      type: String,
      trim: true
    },
    processingTime: {
      type: String,
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'visatypes'
  }
);

// Compound index for unique country + visaType combination
visaTypeSchema.index({ country: 1, visaType: 1 }, { unique: true });

/**
 * VisaType model
 * Used for querying and managing visa type configurations
 */
export const VisaType = mongoose.model<IVisaType>('VisaType', visaTypeSchema);
