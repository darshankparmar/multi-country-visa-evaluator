# Security Documentation

## Overview

The Visa Evaluation Backend API implements multiple layers of security to protect against common vulnerabilities and ensure data integrity. This document details all security features, configurations, and best practices.

## Security Architecture

### Defense in Depth

The application uses a layered security approach:

1. **Network Layer**: CORS, rate limiting, firewall rules
2. **Application Layer**: Input validation, authentication, authorization
3. **Data Layer**: NoSQL injection prevention, PII sanitization
4. **Transport Layer**: HTTPS/TLS, security headers

## Input Validation and Sanitization

### NoSQL Injection Prevention

All MongoDB queries are automatically sanitized to prevent injection attacks.

**Implementation**:
- Removes `$` operators from user input
- Validates object types before database operations
- Uses parameterized queries with Mongoose

**Protected Operations**:
- User email lookups
- Partner API key validation
- Evaluation queries
- All database read/write operations

**Example Attack Prevention**:
```javascript
// Malicious input
{ "email": { "$ne": null } }

// Sanitized to
{ "email": "[object Object]" }
```

### Email Validation

RFC 5322 compliant email validation with additional security checks.

**Features**:
- Format validation (local@domain.tld)
- Length limits (local: 64 chars, domain: 255 chars)
- Special character validation
- Domain validation
- Prevents email injection attacks

**Blocked Patterns**:
- Newline characters (`\n`, `\r`)
- Multiple @ symbols
- Invalid special characters
- Excessively long addresses

**Example**:
```typescript
// Valid
validateEmail('user@example.com') // ✓

// Invalid
validateEmail('user@example.com\nBCC:attacker@evil.com') // ✗
validateEmail('user@@example.com') // ✗
```

### File Type Validation

Multi-layer file validation for uploaded documents.

**Validation Layers**:

1. **MIME Type Check**: Validates Content-Type header
2. **Magic Number Validation**: Reads file signature bytes
3. **Extension Validation**: Verifies file extension matches content

**Allowed File Types**:

| Type | MIME Type | Magic Numbers | Extensions |
|------|-----------|---------------|------------|
| PDF | application/pdf | `25 50 44 46` (%PDF) | .pdf |
| DOCX | application/vnd.openxmlformats-officedocument.wordprocessingml.document | `50 4B 03 04` (ZIP) | .docx |
| DOC | application/msword | `D0 CF 11 E0` | .doc |
| JPEG | image/jpeg | `FF D8 FF` | .jpg, .jpeg |
| PNG | image/png | `89 50 4E 47` | .png |

**Attack Prevention**:
- Prevents file type spoofing
- Blocks executable files disguised as documents
- Validates file content matches declared type

**Example**:
```typescript
// Blocked: .exe file renamed to .pdf
validateFile({
  mimetype: 'application/pdf',
  buffer: Buffer.from([0x4D, 0x5A, ...]) // MZ header (executable)
}) // ✗ Throws ValidationError
```

### Request Schema Validation

Type-safe validation using Zod schemas.

**Features**:
- Runtime type checking
- Detailed error messages
- Nested object validation
- Custom validation rules

**Example Schema**:
```typescript
const createEvaluationSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  country: z.string().min(1),
  visaType: z.string().min(1)
})
```

### PII Sanitization

Automatic sanitization of personally identifiable information in logs.

**Sanitized Fields**:
- Email addresses → `[EMAIL]`
- Phone numbers → `[PHONE]`
- Credit card numbers → `[CREDIT_CARD]`
- Social security numbers → `[SSN]`
- API keys → `[API_KEY]`
- Passwords → `[PASSWORD]`

**Example**:
```typescript
// Log input
logger.info('User registered', { 
  email: 'user@example.com',
  phone: '+1-555-0123'
})

// Logged output
// User registered { email: '[EMAIL]', phone: '[PHONE]' }
```

## Authentication and Authorization

### Partner API Keys

Cryptographically secure API keys for partner authentication.

**Generation**:
```bash
# 32-byte random key (64 hex characters)
openssl rand -hex 32
```

**Features**:
- 256-bit entropy
- Unique per partner
- Stored hashed in database (future enhancement)
- Can be activated/deactivated

**Usage**:
```bash
curl -H "x-api-key: your-api-key-here" \
     http://localhost:3000/api/evaluations
```

**Protected Endpoints**:
- `GET /api/evaluations` - List partner evaluations
- Partner-specific operations

### Admin API Keys

Separate authentication for administrative endpoints.

**Configuration**:
```bash
# Generate admin key
openssl rand -hex 32

# Set in .env
ADMIN_API_KEY=your-generated-key-here
```

**Usage**:
```bash
curl -H "x-admin-key: your-admin-key-here" \
     http://localhost:3000/admin/health
```

**Protected Endpoints**:
- Detailed health checks
- System metrics
- Administrative operations

**Security Notes**:
- Leave `ADMIN_API_KEY` empty to disable admin endpoints
- Store admin key securely (environment variables, secrets manager)
- Rotate admin key regularly
- Never commit admin key to version control

## Security Headers

Automatic security headers on all responses.

### Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | SAMEORIGIN | Prevents clickjacking |
| X-Content-Type-Options | nosniff | Prevents MIME sniffing |
| X-XSS-Protection | 1; mode=block | Enables XSS filter |
| Strict-Transport-Security | max-age=31536000 | Enforces HTTPS (production) |
| Content-Security-Policy | default-src 'self' | Restricts resource loading |

### HSTS (HTTP Strict Transport Security)

**Production Only**: Automatically enabled when `NODE_ENV=production`

**Configuration**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Effect**:
- Forces HTTPS for 1 year
- Applies to all subdomains
- Prevents protocol downgrade attacks

### Content Security Policy

**Default Policy**:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'
```

**Restrictions**:
- Scripts: Only from same origin
- Styles: Only from same origin
- Images: Same origin + data URIs
- Fonts: Only from same origin
- AJAX: Only to same origin
- Frames: Not allowed

## CORS Protection

Cross-Origin Resource Sharing configuration.

### Development Mode

**Permissive Configuration**:
```bash
# Allow all origins
CORS_ORIGINS=*

# Or specific origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Production Mode

**Strict Configuration** (required):
```bash
# MUST specify exact origins (wildcard not allowed)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Validation**:
- Application refuses to start with wildcard in production
- Origins must be comma-separated
- No trailing slashes
- Protocol (http/https) must be specified

**Example Error**:
```
Error: CORS wildcard (*) is not allowed in production
```

### CORS Headers

**Allowed Headers**:
- Content-Type
- Authorization
- x-api-key
- x-admin-key

**Allowed Methods**:
- GET
- POST
- PUT
- PATCH
- DELETE
- OPTIONS

**Credentials**: Enabled for authenticated requests

## Rate Limiting

Comprehensive rate limiting to prevent abuse.

### Rate Limit Tiers

| Tier | Limit | Window | Identifier | Endpoints |
|------|-------|--------|------------|-----------|
| General | 100 req | 15 min | IP | All public endpoints |
| Evaluation | 10 req | 1 hour | IP | POST /api/evaluations |
| Public Read | 200 req | 15 min | IP | GET /api/visa-types, GET /api/evaluations/:id |
| Download | 20 req | 15 min | IP | File downloads |
| Partner | 1000 req | 1 hour | API key | All partner endpoints |
| Partner Eval | 50 req | 1 hour | API key | POST /api/evaluations (with API key) |

### Configuration

**Environment Variables**:
```bash
# General API
RATE_LIMIT_GENERAL_MAX=100
RATE_LIMIT_GENERAL_WINDOW_MS=900000

# Evaluation submissions
RATE_LIMIT_EVALUATION_MAX=10
RATE_LIMIT_EVALUATION_WINDOW_MS=3600000

# Public read operations
RATE_LIMIT_PUBLIC_READ_MAX=200
RATE_LIMIT_PUBLIC_READ_WINDOW_MS=900000

# Download operations
RATE_LIMIT_DOWNLOAD_MAX=20
RATE_LIMIT_DOWNLOAD_WINDOW_MS=900000

# Partner API
RATE_LIMIT_PARTNER_MAX=1000
RATE_LIMIT_PARTNER_WINDOW_MS=3600000

# Partner evaluations
RATE_LIMIT_PARTNER_EVAL_MAX=50
RATE_LIMIT_PARTNER_EVAL_WINDOW_MS=3600000
```

### Implementation

**Algorithm**: Sliding window with automatic cleanup

**Storage**: In-memory (resets on application restart)

**Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-11-18T15:30:00.000Z
```

**Exceeded Response**:
```json
{
  "status": "error",
  "message": "Too many requests, please try again later",
  "retryAfter": 3600
}
```

**Exclusions**:
- Health check endpoints (`/health`)
- Static file serving

### Production Considerations

**For High-Traffic Applications**:
- Consider Redis-based rate limiting for persistence
- Implement distributed rate limiting for multi-server deployments
- Monitor rate limit violations
- Adjust limits based on usage patterns

## Timeout Protection

Multi-layer timeout protection prevents resource exhaustion.

### Timeout Hierarchy

```
REQUEST_TIMEOUT_MS (120s)
├── AI_API_TIMEOUT_MS (60s)
├── PARSING_TIMEOUT (30s)
├── DB_QUERY_TIMEOUT_MS (10s)
└── FILE_UPLOAD_TIMEOUT_MS (120s)
```

**Rule**: Overall timeout must be greater than sum of sub-operation timeouts

### Configuration

```bash
# Overall request timeout
REQUEST_TIMEOUT_MS=120000           # 2 minutes

# Operation-specific timeouts
AI_API_TIMEOUT_MS=60000             # 60 seconds
PARSING_TIMEOUT=30000               # 30 seconds
DB_QUERY_TIMEOUT_MS=10000           # 10 seconds
FILE_UPLOAD_TIMEOUT_MS=120000       # 2 minutes
```

### Timeout Behavior

**On Timeout**:
1. Operation is aborted
2. Resources are cleaned up
3. 408 Request Timeout response sent
4. Error logged with context

**Example Response**:
```json
{
  "status": "error",
  "message": "Request timeout - processing took too long"
}
```

### Best Practices

**Development**:
- Use longer timeouts for debugging
- Monitor timeout logs

**Production**:
- Set timeouts based on 95th percentile response times
- Add 20-30% buffer for network latency
- Monitor timeout rates
- Alert on timeout spikes

## File Upload Security

Comprehensive file upload protection.

### Size Limits

```bash
# Per file
MAX_FILE_SIZE=5242880  # 5MB

# Total request (Nginx/reverse proxy)
client_max_body_size 10M;
```

### Validation

**Multi-Layer Validation**:
1. File size check
2. MIME type validation
3. Magic number verification
4. Extension validation
5. Content scanning (future: virus scanning)

### Storage Security

**File Naming**:
- Timestamp prefix prevents collisions
- Original filename preserved in metadata
- No user-controlled filenames in storage

**Example**:
```
Original: resume.pdf
Stored: 1700220600000-resume.pdf
```

**Directory Security**:
- Uploads stored outside web root
- No directory listing
- Access controlled by application

### Path Traversal Prevention

**Blocked Patterns**:
- `../` (parent directory)
- `..\\` (Windows parent directory)
- Absolute paths
- Symbolic links

**Example**:
```typescript
// Blocked
filename: '../../../etc/passwd'
filename: 'C:\\Windows\\System32\\config\\sam'

// Allowed
filename: 'resume.pdf'
```

## Database Security

### Connection Security

**Production Configuration**:
```bash
# Use authentication
MONGODB_URI=mongodb://username:password@host:port/database

# Use TLS/SSL
MONGODB_URI=mongodb://user:pass@host:port/db?ssl=true

# Use MongoDB Atlas (recommended)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

### Query Timeout

All database queries have automatic timeout:

```bash
DB_QUERY_TIMEOUT_MS=10000  # 10 seconds
```

**Benefits**:
- Prevents long-running queries
- Protects against DoS attacks
- Ensures responsive API

### NoSQL Injection Prevention

**Automatic Sanitization**:
- All user input sanitized before queries
- `$` operators removed
- Object types validated

**Example**:
```typescript
// Malicious input
{ email: { $ne: null } }

// Sanitized query
{ email: "[object Object]" }  // Won't match any records
```

## Logging and Monitoring

### Secure Logging

**PII Sanitization**:
- Automatic in all log levels
- Applies to structured and text logs
- Configurable patterns

**Log Levels**:
```bash
# Development
LOG_LEVEL=debug

# Production
LOG_LEVEL=warn
```

### Security Event Logging

**Logged Events**:
- Authentication failures
- Rate limit violations
- Validation errors
- Timeout events
- File upload rejections
- CORS violations

**Example Log**:
```json
{
  "level": "warn",
  "message": "Authentication failed",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "ip": "192.168.1.100",
  "apiKey": "[API_KEY]",
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

### Log Rotation

**Configuration** (logrotate):
```
/opt/visa-api/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 visaapi visaapi
}
```

## Environment Security

### Environment Variables

**Best Practices**:
- Never commit `.env` to version control
- Use `.env.example` as template
- Restrict file permissions: `chmod 600 .env`
- Use secrets management in production

**Secrets Management**:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager

### Production Checklist

- [ ] `NODE_ENV=production`
- [ ] Strong `ADMIN_API_KEY` generated
- [ ] `CORS_ORIGINS` set to exact domains
- [ ] MongoDB authentication enabled
- [ ] SMTP credentials secured
- [ ] Rate limits configured
- [ ] Timeouts configured
- [ ] HTTPS/TLS enabled
- [ ] Security headers enabled
- [ ] Logs sanitized
- [ ] File upload limits set
- [ ] Backups configured

## Vulnerability Management

### Dependency Scanning

**Regular Audits**:
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Fix with breaking changes
npm audit fix --force
```

**Automated Scanning**:
- GitHub Dependabot
- Snyk
- npm audit in CI/CD

### Update Strategy

**Security Updates**:
- Apply immediately
- Test in staging
- Deploy to production

**Regular Updates**:
- Monthly dependency review
- Quarterly major version updates
- Annual security audit

## Incident Response

### Security Incident Procedure

1. **Detection**: Monitor logs for suspicious activity
2. **Containment**: Disable affected endpoints/keys
3. **Investigation**: Review logs and access patterns
4. **Remediation**: Apply fixes and patches
5. **Recovery**: Restore normal operations
6. **Post-Mortem**: Document and improve

### Emergency Contacts

**Security Issues**:
- Report to: security@yourdomain.com
- Include: Detailed description, steps to reproduce, impact assessment

### Key Rotation

**Partner API Keys**:
```bash
# Deactivate compromised key
PATCH /api/partners/:id/status
{ "active": false }

# Generate new key
POST /api/partners
```

**Admin API Key**:
```bash
# Generate new key
openssl rand -hex 32

# Update .env
ADMIN_API_KEY=new-key-here

# Restart application
pm2 restart visa-api
```

## Compliance

### Data Protection

**GDPR Considerations**:
- PII sanitization in logs
- Data retention policies
- Right to deletion (implement as needed)
- Data export capabilities

**Data Minimization**:
- Collect only necessary information
- Automatic PII sanitization
- Secure data storage

### Audit Trail

**Logged Operations**:
- Evaluation submissions
- Partner API key usage
- Admin operations
- Authentication attempts
- Rate limit violations

## Security Testing

### Recommended Tests

**Input Validation**:
- SQL/NoSQL injection attempts
- XSS payloads
- Path traversal attempts
- File upload exploits

**Authentication**:
- Invalid API keys
- Missing authentication
- Key reuse attempts

**Rate Limiting**:
- Burst traffic tests
- Sustained high traffic
- Distributed attacks

**Tools**:
- OWASP ZAP
- Burp Suite
- npm audit
- Snyk

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

---

**Last Updated**: November 2025
