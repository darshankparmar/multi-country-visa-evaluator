import mongoose, { Schema } from 'mongoose';
import { IPartner } from '../types/partner.types';

/**
 * Mongoose schema for Partner
 * Defines structure for immigration law partner accounts with API keys
 */
const partnerSchema = new Schema<IPartner>(
  {
    name: {
      type: String,
      required: [true, 'Partner name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Invalid email format'
      }
    },
    apiKey: {
      type: String,
      required: [true, 'API key is required'],
      unique: true,
      index: true
    },
    contactInfo: {
      phone: {
        type: String,
        trim: true
      },
      website: {
        type: String,
        trim: true
      }
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'partners'
  }
);

/**
 * Partner model
 * Used for managing partner accounts and API key authentication
 */
export const Partner = mongoose.model<IPartner>('Partner', partnerSchema);
