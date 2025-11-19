/**
 * Tests for sanitization utilities to prevent NoSQL injection
 */

import {
  sanitizeQueryValue,
  sanitizeQueryObject,
  sanitizeEmail,
  sanitizeCountry,
  sanitizeObjectId
} from '../utils/sanitization';

describe('Sanitization Utilities', () => {
  describe('sanitizeQueryValue', () => {
    it('should remove MongoDB operators from strings', () => {
      expect(sanitizeQueryValue('$ne')).toBe('ne');
      expect(sanitizeQueryValue('$gt')).toBe('gt');
      expect(sanitizeQueryValue('$regex')).toBe('regex');
    });

    it('should handle normal strings without operators', () => {
      expect(sanitizeQueryValue('normal-value')).toBe('normal-value');
      expect(sanitizeQueryValue('test@example.com')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeQueryValue('  value  ')).toBe('value');
    });

    it('should convert non-strings to strings', () => {
      expect(sanitizeQueryValue(123 as any)).toBe('123');
    });
  });

  describe('sanitizeQueryObject', () => {
    it('should remove keys starting with $', () => {
      const input = {
        name: 'test',
        $ne: 'malicious',
        $gt: 100
      };
      const result = sanitizeQueryObject(input);
      expect(result).toEqual({ name: 'test' });
      expect(result.$ne).toBeUndefined();
      expect(result.$gt).toBeUndefined();
    });

    it('should remove keys containing dots', () => {
      const input = {
        name: 'test',
        'user.role': 'admin'
      };
      const result = sanitizeQueryObject(input);
      expect(result).toEqual({ name: 'test' });
      expect(result['user.role']).toBeUndefined();
    });

    it('should handle nested objects recursively', () => {
      const input = {
        user: {
          name: 'test',
          $ne: 'malicious'
        }
      };
      const result = sanitizeQueryObject(input);
      expect(result).toEqual({
        user: { name: 'test' }
      });
    });

    it('should handle arrays', () => {
      const input = {
        tags: ['tag1', 'tag2'],
        $in: ['malicious']
      };
      const result = sanitizeQueryObject(input);
      expect(result).toEqual({
        tags: ['tag1', 'tag2']
      });
    });

    it('should handle null and undefined', () => {
      expect(sanitizeQueryObject(null)).toBeNull();
      expect(sanitizeQueryObject(undefined)).toBeUndefined();
    });
  });

  describe('sanitizeEmail', () => {
    it('should accept valid email addresses', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
      expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });

    it('should reject invalid email formats', () => {
      expect(() => sanitizeEmail('not-an-email')).toThrow('Invalid email format');
      expect(() => sanitizeEmail('missing@domain')).toThrow('Invalid email format');
      expect(() => sanitizeEmail('@example.com')).toThrow('Invalid email format');
    });

    it('should remove MongoDB operators from emails', () => {
      // After sanitization, $ne becomes ne, making it ne@example.com which is valid
      const result = sanitizeEmail('$ne@example.com');
      expect(result).toBe('ne@example.com');
    });

    it('should reject non-string inputs', () => {
      expect(() => sanitizeEmail(123 as any)).toThrow('Email must be a string');
      expect(() => sanitizeEmail(null as any)).toThrow('Email must be a string');
    });

    it('should trim and lowercase emails', () => {
      expect(sanitizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
    });
  });

  describe('sanitizeCountry', () => {
    it('should accept valid country names', () => {
      expect(sanitizeCountry('United States')).toBe('United States');
      expect(sanitizeCountry('United-Kingdom')).toBe('United-Kingdom');
    });

    it('should remove special characters', () => {
      expect(sanitizeCountry('United$States')).toBe('UnitedStates');
      expect(sanitizeCountry('Test123')).toBe('Test');
    });

    it('should reject empty strings after sanitization', () => {
      expect(() => sanitizeCountry('$$$')).toThrow('Invalid country name');
      expect(() => sanitizeCountry('123')).toThrow('Invalid country name');
    });

    it('should reject non-string inputs', () => {
      expect(() => sanitizeCountry(123 as any)).toThrow('Country must be a string');
    });

    it('should trim whitespace', () => {
      expect(sanitizeCountry('  United States  ')).toBe('United States');
    });
  });

  describe('sanitizeObjectId', () => {
    it('should accept valid MongoDB ObjectIds', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(sanitizeObjectId(validId)).toBe(validId);
    });

    it('should reject invalid ObjectId formats', () => {
      expect(() => sanitizeObjectId('invalid')).toThrow('Invalid ObjectId format');
      expect(() => sanitizeObjectId('507f1f77bcf86cd79943901')).toThrow('Invalid ObjectId format'); // Too short
      expect(() => sanitizeObjectId('507f1f77bcf86cd7994390111')).toThrow('Invalid ObjectId format'); // Too long
      expect(() => sanitizeObjectId('507f1f77bcf86cd79943901g')).toThrow('Invalid ObjectId format'); // Invalid char
    });

    it('should reject non-string inputs', () => {
      expect(() => sanitizeObjectId(123 as any)).toThrow('ObjectId must be a string');
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should prevent $ne operator injection', () => {
      const maliciousEmail = { $ne: 'test@example.com' };
      const sanitized = sanitizeQueryObject(maliciousEmail);
      expect(sanitized.$ne).toBeUndefined();
    });

    it('should prevent $gt operator injection', () => {
      const maliciousQuery = { age: { $gt: 0 } };
      const sanitized = sanitizeQueryObject(maliciousQuery);
      expect(sanitized.age).toEqual({});
    });

    it('should prevent $regex injection', () => {
      const maliciousQuery = { email: { $regex: '.*' } };
      const sanitized = sanitizeQueryObject(maliciousQuery);
      expect(sanitized.email).toEqual({});
    });

    it('should prevent prototype pollution via dot notation', () => {
      const maliciousQuery = { '__proto__.isAdmin': true };
      const sanitized = sanitizeQueryObject(maliciousQuery);
      expect(sanitized['__proto__.isAdmin']).toBeUndefined();
    });
  });
});
