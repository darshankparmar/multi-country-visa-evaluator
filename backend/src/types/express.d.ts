import { IPartner } from './partner.types';

/**
 * Extend Express Request type to include partner property
 * This allows authenticated partner data to be attached to requests
 */
declare global {
  namespace Express {
    interface Request {
      partner?: IPartner;
      requestId?: string;
    }
  }
}

export {};
