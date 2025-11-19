/**
 * Utility for sanitizing Personally Identifiable Information (PII) from text
 * Used to protect sensitive data in logs and audit trails
 */

/**
 * Sanitize text by removing common PII patterns
 * @param text Text content to sanitize
 * @returns Sanitized text with PII replaced by placeholders
 */
export function sanitizePII(text: string): string {
  if (!text) {
    return text;
  }

  let sanitized = text;

  // Remove email addresses - show only first 2 chars and domain
  sanitized = sanitized.replace(
    /\b([A-Za-z0-9._%+-]{1,2})[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/g,
    (_match, prefix, domain) => `${prefix}***@${domain}`
  );

  // Remove full names (First Last pattern)
  sanitized = sanitized.replace(
    /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g,
    (_match, first, last) => `${first.charAt(0)}*** ${last.charAt(0)}***`
  );

  // Remove US Social Security Numbers (XXX-XX-XXXX)
  sanitized = sanitized.replace(
    /\b\d{3}-\d{2}-\d{4}\b/g,
    '[SSN]'
  );

  // Remove phone numbers (various formats)
  sanitized = sanitized.replace(
    /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    '[PHONE]'
  );

  // Remove credit card numbers (basic pattern)
  sanitized = sanitized.replace(
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    '[CREDIT_CARD]'
  );

  // Remove passport numbers (basic pattern - alphanumeric 6-9 chars)
  sanitized = sanitized.replace(
    /\b[A-Z]{1,2}\d{6,9}\b/g,
    '[PASSPORT]'
  );

  // Remove dates of birth (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
  sanitized = sanitized.replace(
    /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g,
    '[DATE]'
  );
  sanitized = sanitized.replace(
    /\b(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/g,
    '[DATE]'
  );

  // Remove street addresses (basic pattern)
  sanitized = sanitized.replace(
    /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b/gi,
    '[ADDRESS]'
  );

  // Remove ZIP codes (US format)
  sanitized = sanitized.replace(
    /\b\d{5}(?:-\d{4})?\b/g,
    '[ZIP]'
  );

  // Remove API keys and tokens (common patterns)
  sanitized = sanitized.replace(
    /\b(sk|pk|api|token)[-_][a-zA-Z0-9]{20,}\b/gi,
    '[API_KEY]'
  );

  return sanitized;
}

/**
 * Sanitize email for logging - show only first 2 chars and domain
 * @param email Email address to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '[INVALID_EMAIL]';
  }
  
  const match = email.match(/^([^@]{1,2})[^@]*@(.+)$/);
  if (match) {
    return `${match[1]}***@${match[2]}`;
  }
  
  return '[EMAIL]';
}

/**
 * Sanitize name for logging - show only first letter
 * @param name Name to sanitize
 * @returns Sanitized name
 */
export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '[NAME]';
  }
  
  const parts = name.trim().split(/\s+/);
  return parts.map(part => `${part.charAt(0)}***`).join(' ');
}

/**
 * Sanitize text for logging with length limit
 * Combines PII sanitization with text truncation
 * @param text Text content to sanitize
 * @param maxLength Maximum length of sanitized text (default: 500)
 * @returns Sanitized and truncated text
 */
export function sanitizeForLogging(text: string, maxLength: number = 500): string {
  if (!text) {
    return text;
  }

  // First sanitize PII
  let sanitized = sanitizePII(text);

  // Then truncate if needed
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '... [truncated for logging]';
  }

  return sanitized;
}
