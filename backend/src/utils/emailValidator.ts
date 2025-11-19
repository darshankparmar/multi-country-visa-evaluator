import { ValidationError } from './errors';

/**
 * RFC 5322 compliant email validation regex
 * More strict than basic email validation
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Maximum email length per RFC 5321
 */
const MAX_EMAIL_LENGTH = 254;

/**
 * Maximum local part length (before @)
 */
const MAX_LOCAL_PART_LENGTH = 64;

/**
 * Maximum domain length (after @)
 */
const MAX_DOMAIN_LENGTH = 255;

/**
 * Validates email address format and checks for injection attempts
 * 
 * @param email - Email address to validate
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateEmailAddress(email: string): boolean {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email address is required');
  }

  // Check for email header injection attempts BEFORE trimming
  // These characters can be used to inject additional headers
  if (
    email.includes('\n') ||
    email.includes('\r') ||
    email.includes('\0') ||
    email.includes('%0a') ||
    email.includes('%0d') ||
    email.includes('%00')
  ) {
    throw new ValidationError('Email address contains invalid characters');
  }

  // Trim whitespace
  const trimmedEmail = email.trim();

  // Check length
  if (trimmedEmail.length === 0) {
    throw new ValidationError('Email address cannot be empty');
  }

  if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
    throw new ValidationError(`Email address exceeds maximum length of ${MAX_EMAIL_LENGTH} characters`);
  }

  // Check for multiple @ symbols
  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    throw new ValidationError('Email address must contain exactly one @ symbol');
  }

  // Split into local and domain parts
  const [localPart, domain] = trimmedEmail.split('@');

  // Validate local part length
  if (localPart.length > MAX_LOCAL_PART_LENGTH) {
    throw new ValidationError(`Email local part exceeds maximum length of ${MAX_LOCAL_PART_LENGTH} characters`);
  }

  // Validate domain length
  if (domain.length > MAX_DOMAIN_LENGTH) {
    throw new ValidationError(`Email domain exceeds maximum length of ${MAX_DOMAIN_LENGTH} characters`);
  }

  // Check for consecutive dots
  if (trimmedEmail.includes('..')) {
    throw new ValidationError('Email address cannot contain consecutive dots');
  }

  // Check if local part starts or ends with dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    throw new ValidationError('Email local part cannot start or end with a dot');
  }

  // Check if domain starts or ends with dot or hyphen
  if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) {
    throw new ValidationError('Email domain has invalid format');
  }

  // Validate against RFC 5322 regex
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    throw new ValidationError('Email address format is invalid');
  }

  // Additional check: domain must have at least one dot
  if (!domain.includes('.')) {
    throw new ValidationError('Email domain must contain at least one dot');
  }

  // Check for common typos in popular domains
  const commonTypos = [
    'gmial.com', 'gmai.com', 'gmil.com', 'yahooo.com', 'yaho.com',
    'hotmial.com', 'hotmal.com', 'outlok.com', 'outloo.com'
  ];
  
  if (commonTypos.includes(domain.toLowerCase())) {
    throw new ValidationError('Email domain appears to be a typo. Please check and correct it.');
  }

  return true;
}

/**
 * Sanitizes email address for safe use
 * Removes any potentially dangerous characters
 * 
 * @param email - Email address to sanitize
 * @returns Sanitized email address
 */
export function sanitizeEmailAddress(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Remove all control characters and whitespace
  let sanitized = email
    .trim()
    .toLowerCase()
    .replace(/[\r\n\0\t]/g, '')
    .replace(/%0a|%0d|%00/gi, '');

  return sanitized;
}

/**
 * Validates and sanitizes email address
 * Combines validation and sanitization in one step
 * 
 * @param email - Email address to validate and sanitize
 * @returns Sanitized email address
 * @throws ValidationError if invalid
 */
export function validateAndSanitizeEmail(email: string): string {
  const sanitized = sanitizeEmailAddress(email);
  validateEmailAddress(sanitized);
  return sanitized;
}

/**
 * Checks if email domain is from a disposable email provider
 * Helps prevent spam and fake accounts
 * 
 * @param email - Email address to check
 * @returns true if disposable, false otherwise
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'maildrop.cc', 'temp-mail.org', 'fakeinbox.com',
    'trashmail.com', 'yopmail.com', 'getnada.com', 'emailondeck.com'
  ];

  try {
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  } catch {
    return false;
  }
}
