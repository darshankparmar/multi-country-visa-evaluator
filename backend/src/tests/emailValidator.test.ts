import { validateEmailAddress, sanitizeEmailAddress, validateAndSanitizeEmail, isDisposableEmail } from '../utils/emailValidator';
import { ValidationError } from '../utils/errors';

describe('Email Validator', () => {
  describe('validateEmailAddress', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user_name@example.co.uk',
        'user123@subdomain.example.com',
        'a@example.com',
        'test.email.with+symbol@example4u.net'
      ];

      validEmails.forEach(email => {
        expect(() => validateEmailAddress(email)).not.toThrow();
      });
    });

    it('should reject email with newline characters', () => {
      expect(() => validateEmailAddress('user@example.com\n')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user@example.com\nBcc: attacker@evil.com')).toThrow(ValidationError);
    });

    it('should reject email with carriage return', () => {
      expect(() => validateEmailAddress('user@example.com\r')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user@example.com\rBcc: attacker@evil.com')).toThrow(ValidationError);
    });

    it('should reject email with null byte', () => {
      expect(() => validateEmailAddress('user@example.com\0')).toThrow(ValidationError);
    });

    it('should reject email with URL encoded injection attempts', () => {
      expect(() => validateEmailAddress('user@example.com%0a')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user@example.com%0d')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user@example.com%00')).toThrow(ValidationError);
    });

    it('should reject email with multiple @ symbols', () => {
      expect(() => validateEmailAddress('user@@example.com')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user@domain@example.com')).toThrow(ValidationError);
    });

    it('should reject email with consecutive dots', () => {
      expect(() => validateEmailAddress('user..name@example.com')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user@example..com')).toThrow(ValidationError);
    });

    it('should reject email starting or ending with dot', () => {
      expect(() => validateEmailAddress('.user@example.com')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user.@example.com')).toThrow(ValidationError);
    });

    it('should reject email with invalid domain', () => {
      expect(() => validateEmailAddress('user@.example.com')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user@example.com.')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user@-example.com')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user@example.com-')).toThrow(ValidationError);
    });

    it('should reject email without domain extension', () => {
      expect(() => validateEmailAddress('user@example')).toThrow(ValidationError);
    });

    it('should reject email exceeding maximum length', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => validateEmailAddress(longEmail)).toThrow(ValidationError);
    });

    it('should reject email with long local part', () => {
      const longLocal = 'a'.repeat(65) + '@example.com';
      expect(() => validateEmailAddress(longLocal)).toThrow(ValidationError);
    });

    it('should reject empty or invalid input', () => {
      expect(() => validateEmailAddress('')).toThrow(ValidationError);
      expect(() => validateEmailAddress('   ')).toThrow(ValidationError);
      expect(() => validateEmailAddress('not-an-email')).toThrow(ValidationError);
    });

    it('should reject common typo domains', () => {
      expect(() => validateEmailAddress('user@gmial.com')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user@yahooo.com')).toThrow(ValidationError);
      expect(() => validateEmailAddress('user@hotmial.com')).toThrow(ValidationError);
    });
  });

  describe('sanitizeEmailAddress', () => {
    it('should remove control characters', () => {
      expect(sanitizeEmailAddress('user@example.com\n')).toBe('user@example.com');
      expect(sanitizeEmailAddress('user@example.com\r')).toBe('user@example.com');
      expect(sanitizeEmailAddress('user@example.com\0')).toBe('user@example.com');
    });

    it('should remove URL encoded injection attempts', () => {
      expect(sanitizeEmailAddress('user@example.com%0a')).toBe('user@example.com');
      expect(sanitizeEmailAddress('user@example.com%0d')).toBe('user@example.com');
      expect(sanitizeEmailAddress('user@example.com%00')).toBe('user@example.com');
    });

    it('should trim whitespace and convert to lowercase', () => {
      expect(sanitizeEmailAddress('  User@Example.COM  ')).toBe('user@example.com');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeEmailAddress('')).toBe('');
      expect(sanitizeEmailAddress('   ')).toBe('');
    });
  });

  describe('validateAndSanitizeEmail', () => {
    it('should sanitize and validate in one step', () => {
      expect(validateAndSanitizeEmail('  User@Example.COM  ')).toBe('user@example.com');
    });

    it('should throw error for invalid email after sanitization', () => {
      expect(() => validateAndSanitizeEmail('not-an-email')).toThrow(ValidationError);
    });
  });

  describe('isDisposableEmail', () => {
    it('should detect disposable email domains', () => {
      expect(isDisposableEmail('user@tempmail.com')).toBe(true);
      expect(isDisposableEmail('user@10minutemail.com')).toBe(true);
      expect(isDisposableEmail('user@mailinator.com')).toBe(true);
    });

    it('should not flag legitimate email domains', () => {
      expect(isDisposableEmail('user@gmail.com')).toBe(false);
      expect(isDisposableEmail('user@yahoo.com')).toBe(false);
      expect(isDisposableEmail('user@company.com')).toBe(false);
    });

    it('should handle invalid input gracefully', () => {
      expect(isDisposableEmail('not-an-email')).toBe(false);
      expect(isDisposableEmail('')).toBe(false);
    });
  });
});
