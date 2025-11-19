/**
 * Utility functions for sanitizing user input to prevent injection attacks
 * Specifically designed to prevent NoSQL injection in MongoDB queries
 */

/**
 * Sanitize a string value to prevent MongoDB operator injection
 * Removes any MongoDB operators ($ne, $gt, $regex, etc.) from user input
 * 
 * @param value - User input string to sanitize
 * @returns Sanitized string safe for MongoDB queries
 */
export function sanitizeQueryValue(value: string): string {
  if (typeof value !== 'string') {
    return String(value);
  }
  
  // Remove MongoDB operators by removing $ prefix
  // This prevents injection of operators like $ne, $gt, $regex, etc.
  return value.replace(/^\$/, '').trim();
}

/**
 * Sanitize an object to prevent MongoDB operator injection
 * Recursively removes any keys starting with $ or containing .
 * 
 * @param obj - Object to sanitize
 * @returns Sanitized object safe for MongoDB queries
 */
export function sanitizeQueryObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeQueryObject(item));
  }
  
  const sanitized: any = {};
  
  for (const key in obj) {
    // Skip keys that start with $ (MongoDB operators)
    if (key.startsWith('$')) {
      continue;
    }
    
    // Skip keys that contain . (could be used for prototype pollution)
    if (key.includes('.')) {
      continue;
    }
    
    // Recursively sanitize nested objects
    sanitized[key] = sanitizeQueryObject(obj[key]);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize email for database queries
 * Ensures email is in valid format and safe for queries
 * 
 * @param email - Email address to validate and sanitize
 * @returns Sanitized email or throws error if invalid
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    throw new Error('Email must be a string');
  }
  
  // Remove any MongoDB operators
  const sanitized = sanitizeQueryValue(email.toLowerCase().trim());
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Sanitize country name for database queries
 * Ensures only alphanumeric characters and spaces
 * 
 * @param country - Country name to sanitize
 * @returns Sanitized country name
 */
export function sanitizeCountry(country: string): string {
  if (typeof country !== 'string') {
    throw new Error('Country must be a string');
  }
  
  // Remove MongoDB operators
  const sanitized = sanitizeQueryValue(country.trim());
  
  // Only allow letters, spaces, and hyphens
  const cleaned = sanitized.replace(/[^a-zA-Z\s-]/g, '');
  
  if (cleaned.length === 0) {
    throw new Error('Invalid country name');
  }
  
  return cleaned;
}

/**
 * Sanitize MongoDB ObjectId string
 * Ensures it matches the expected format
 * 
 * @param id - ObjectId string to sanitize
 * @returns Sanitized ObjectId string
 */
export function sanitizeObjectId(id: string): string {
  if (typeof id !== 'string') {
    throw new Error('ObjectId must be a string');
  }
  
  // MongoDB ObjectId is 24 hex characters
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdRegex.test(id)) {
    throw new Error('Invalid ObjectId format');
  }
  
  return id;
}
