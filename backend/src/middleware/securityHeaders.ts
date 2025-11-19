import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { getConfig } from '../config/environment';
import { logger } from '../config/logger';

/**
 * Configure and apply security headers using Helmet
 * Protects against common web vulnerabilities
 * 
 * Security headers included:
 * - Content-Security-Policy (CSP)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Strict-Transport-Security (HSTS)
 * - Referrer-Policy
 * - Permissions-Policy
 */
export function configureSecurityHeaders() {
  const config = getConfig();
  const isProduction = config.NODE_ENV === 'production';

  // Log security headers configuration
  logger.info('Configuring security headers', {
    environment: config.NODE_ENV,
    hsts: isProduction,
    csp: true
  });

  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'none'"], // Prevent clickjacking
        imgSrc: ["'self'", 'data:', 'https:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"], // unsafe-inline needed for some frameworks
        upgradeInsecureRequests: isProduction ? [] : null, // Only in production
        connectSrc: ["'self'"]
      }
    },

    // Strict Transport Security (HSTS)
    // Only enable in production to avoid issues with local development
    hsts: isProduction ? {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true
    } : false,

    // X-Frame-Options: Prevent clickjacking
    frameguard: {
      action: 'deny'
    },

    // X-Content-Type-Options: Prevent MIME sniffing
    noSniff: true,

    // X-DNS-Prefetch-Control: Control DNS prefetching
    dnsPrefetchControl: {
      allow: false
    },

    // X-Download-Options: Prevent IE from executing downloads
    ieNoOpen: true,

    // Referrer-Policy: Control referrer information
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },

    // X-Permitted-Cross-Domain-Policies: Restrict Adobe Flash and PDF
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none'
    },

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false, // Set to true if you need stronger isolation

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: {
      policy: 'same-origin'
    },

    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: {
      policy: 'same-origin'
    },

    // Origin-Agent-Cluster
    originAgentCluster: true
  });
}

/**
 * Additional custom security headers middleware
 * Adds extra security headers not covered by Helmet
 */
export function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  const config = getConfig();

  // Permissions-Policy (formerly Feature-Policy)
  // Disable potentially dangerous browser features
  res.setHeader('Permissions-Policy', [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()'
  ].join(', '));

  // X-Content-Type-Options (additional enforcement)
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options (additional enforcement)
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection (for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict-Transport-Security (additional enforcement for production)
  if (config.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Cache-Control for API responses
  // Prevent caching of sensitive data
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

/**
 * Security headers validation middleware
 * Logs security headers for monitoring and debugging
 */
export function logSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Only log in development or on first request
  if (process.env.NODE_ENV === 'development' && !res.locals.securityHeadersLogged) {
    res.on('finish', () => {
      const headers = {
        'content-security-policy': res.getHeader('content-security-policy'),
        'x-frame-options': res.getHeader('x-frame-options'),
        'x-content-type-options': res.getHeader('x-content-type-options'),
        'strict-transport-security': res.getHeader('strict-transport-security'),
        'referrer-policy': res.getHeader('referrer-policy'),
        'permissions-policy': res.getHeader('permissions-policy')
      };

      logger.debug('Security headers applied', {
        path: req.path,
        headers
      });
    });

    res.locals.securityHeadersLogged = true;
  }

  next();
}
