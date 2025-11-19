# Documentation Maintenance Guide

This guide helps maintain consistency across documentation files and prevents duplicate content.

## Documentation Structure

### README.md (Main Entry Point)
**Purpose**: Quick start guide and overview  
**Target Audience**: Developers getting started  
**Content**:
- Project overview and key objectives
- Technology stack summary
- Quick installation steps (1-6)
- Essential environment variables only (condensed table)
- Features overview (bullet points)
- Quick API reference table
- Quick troubleshooting table
- Links to detailed documentation

**What NOT to include**:
- Detailed environment variable descriptions (→ .env.example or DEPLOYMENT.md)
- Complete security documentation (→ SECURITY.md)
- Detailed rate limiting info (→ SECURITY.md or API.md)
- Production deployment details (→ DEPLOYMENT.md)
- Detailed troubleshooting (→ specific guides)

---

### docs/API.md
**Purpose**: Complete API endpoint reference  
**Target Audience**: API consumers, frontend developers, partners  
**Content**:
- Response format standards
- HTTP status codes
- Authentication methods (partner + admin)
- All endpoint specifications with examples
- Request/response schemas
- Security features overview (brief)
- Rate limiting overview with headers
- Error handling examples
- File upload requirements
- Testing examples

**What NOT to include**:
- Implementation details (→ ARCHITECTURE.md)
- Deployment instructions (→ DEPLOYMENT.md)
- Detailed security implementation (→ SECURITY.md)
- Environment variable configuration (→ DEPLOYMENT.md)

---

### docs/DEPLOYMENT.md
**Purpose**: Production deployment instructions  
**Target Audience**: DevOps, system administrators  
**Content**:
- Pre-deployment checklist
- Server requirements and setup
- MongoDB setup (Atlas + self-hosted)
- Complete environment variable reference
- PM2 configuration
- Nginx reverse proxy setup
- SSL/HTTPS configuration
- Monitoring and logging setup
- Backup and recovery procedures
- Scaling considerations
- Troubleshooting deployment issues
- Security best practices (deployment-specific)
- Deployment checklist

**What NOT to include**:
- API endpoint documentation (→ API.md)
- Detailed security feature implementation (→ SECURITY.md)
- Development setup (→ README.md)
- Architecture details (→ ARCHITECTURE.md)

---

### docs/SECURITY.md
**Purpose**: Comprehensive security documentation  
**Target Audience**: Security auditors, DevOps, developers  
**Content**:
- Security architecture overview
- Input validation and sanitization details
- NoSQL injection prevention
- Email validation implementation
- File type validation (MIME + magic numbers)
- PII sanitization
- Authentication mechanisms (partner + admin)
- Security headers configuration
- CORS protection details
- Rate limiting implementation
- Timeout protection
- File upload security
- Database security
- Logging and monitoring (security events)
- Environment security
- Vulnerability management
- Incident response procedures
- Compliance considerations
- Security testing recommendations

**What NOT to include**:
- API endpoint specifications (→ API.md)
- Deployment procedures (→ DEPLOYMENT.md)
- Basic usage examples (→ README.md)

---

### docs/ARCHITECTURE.md
**Purpose**: System design and technical architecture  
**Target Audience**: Developers, technical leads  
**Content**:
- Architectural principles
- System architecture diagrams
- Layer details (routes, middleware, controllers, services, repositories)
- Evaluation strategy pattern
- Data flow diagrams
- Component interactions
- Design decisions and rationale

**What NOT to include**:
- API endpoint documentation (→ API.md)
- Deployment instructions (→ DEPLOYMENT.md)
- Security implementation details (→ SECURITY.md)
- Getting started guide (→ README.md)

---

### docs/AI_EVALUATION_GUIDE.md
**Purpose**: AI evaluation feature documentation  
**Target Audience**: Developers implementing AI features  
**Content**:
- AI evaluation overview
- Document parsing details
- Weighted scoring system
- Configuration options
- Mock mode usage
- Troubleshooting AI-specific issues

**What NOT to include**:
- General API documentation (→ API.md)
- Security features (→ SECURITY.md)
- Deployment (→ DEPLOYMENT.md)

---

### docs/PARTNER_API_KEY_GUIDE.md
**Purpose**: Partner integration guide  
**Target Audience**: Partners integrating with the API  
**Content**:
- Partner API key generation
- API key management
- Integration examples
- Best practices for partners

**What NOT to include**:
- Complete API reference (→ API.md)
- Security implementation (→ SECURITY.md)
- Deployment (→ DEPLOYMENT.md)

---

### docs/README.md (Documentation Index)
**Purpose**: Documentation navigation hub  
**Target Audience**: All users  
**Content**:
- Documentation structure overview
- Quick navigation links
- Brief description of each document
- Documentation philosophy

**What NOT to include**:
- Actual documentation content (link to other docs)

---

## Content Ownership Matrix

| Topic | Primary Doc | Secondary References |
|-------|-------------|---------------------|
| Getting Started | README.md | - |
| Environment Variables (Essential) | README.md | .env.example |
| Environment Variables (Complete) | DEPLOYMENT.md | .env.example |
| API Endpoints | API.md | README.md (quick ref) |
| Authentication | API.md | SECURITY.md (implementation) |
| Rate Limiting (Usage) | API.md | README.md (overview) |
| Rate Limiting (Implementation) | SECURITY.md | - |
| Security Features (Overview) | README.md | - |
| Security Features (Detailed) | SECURITY.md | - |
| Deployment | DEPLOYMENT.md | README.md (quick start) |
| Architecture | ARCHITECTURE.md | - |
| AI Evaluation | AI_EVALUATION_GUIDE.md | README.md (overview) |
| Troubleshooting (Quick) | README.md | - |
| Troubleshooting (Detailed) | Specific guides | - |
| MongoDB Setup | DEPLOYMENT.md | README.md (basic) |
| Nginx Configuration | DEPLOYMENT.md | - |
| Security Headers | SECURITY.md | API.md (brief mention) |
| CORS Configuration | SECURITY.md | DEPLOYMENT.md (env vars) |
| Timeout Configuration | SECURITY.md | DEPLOYMENT.md (env vars) |
| File Upload | API.md | SECURITY.md (security aspects) |
| Partner Integration | PARTNER_API_KEY_GUIDE.md | API.md (endpoints) |

---

## Update Checklist

When adding a new feature, update these documents:

### New Environment Variable
- [ ] Add to `.env.example` with comments
- [ ] Add to DEPLOYMENT.md (complete reference)
- [ ] Add to README.md only if essential
- [ ] Update SECURITY.md if security-related

### New API Endpoint
- [ ] Add to API.md with full specification
- [ ] Add to README.md quick reference table
- [ ] Update ARCHITECTURE.md if new pattern
- [ ] Update SECURITY.md if security implications

### New Security Feature
- [ ] Add detailed documentation to SECURITY.md
- [ ] Add brief mention to README.md features
- [ ] Update API.md if affects API usage
- [ ] Update DEPLOYMENT.md if affects deployment

### New Configuration Option
- [ ] Add to `.env.example`
- [ ] Document in DEPLOYMENT.md
- [ ] Update relevant feature guide
- [ ] Add to README.md if essential

### Bug Fix or Change
- [ ] Update affected documentation
- [ ] Update version/last updated date
- [ ] Check for related content in other docs

---

## Documentation Best Practices

### Writing Style
- **Concise**: Use bullet points and tables
- **Actionable**: Provide clear steps and examples
- **Scannable**: Use headers, bold text, and formatting
- **Complete**: Include all necessary information
- **Current**: Update dates and version numbers

### Avoiding Duplication
1. **Before adding content**, check if it exists elsewhere
2. **Use cross-references** instead of copying content
3. **Link to authoritative source** for detailed information
4. **Keep README.md minimal** - link to detailed docs
5. **One source of truth** per topic (see Content Ownership Matrix)

### Cross-Referencing
```markdown
For detailed information, see [Security Guide](SECURITY.md).
```

Instead of duplicating content, always link to the primary source.

### Examples of Good Cross-Referencing

**In README.md**:
```markdown
## Environment Variables
For a complete list of all environment variables, see [.env.example](.env.example) 
or [Deployment Guide](docs/DEPLOYMENT.md).
```

**In API.md**:
```markdown
## Security Features
For detailed security implementation, see [Security Guide](SECURITY.md).
```

**In DEPLOYMENT.md**:
```markdown
## API Endpoints
For complete API documentation, see [API Documentation](API.md).
```

---

## Review Checklist

Before committing documentation changes:

- [ ] No duplicate content across files
- [ ] Cross-references are correct and working
- [ ] Content is in the right document (check Content Ownership Matrix)
- [ ] README.md remains concise (< 350 lines)
- [ ] All code examples are tested
- [ ] Environment variables match .env.example
- [ ] Version/date updated if significant changes
- [ ] No broken links
- [ ] Consistent formatting and style
- [ ] No sensitive information (API keys, passwords)

---

## File Size Guidelines

| Document | Target Lines | Max Lines | Current |
|----------|--------------|-----------|---------|
| README.md | 200-300 | 350 | 294 |
| API.md | 800-1000 | 1200 | ~1127 |
| DEPLOYMENT.md | 800-1000 | 1200 | ~1000 |
| SECURITY.md | 600-800 | 1000 | ~700 |
| ARCHITECTURE.md | 1000-1500 | 2000 | ~1840 |
| Other guides | 300-500 | 800 | Varies |

If a document exceeds max lines, consider:
1. Splitting into multiple focused documents
2. Moving detailed examples to separate files
3. Removing duplicate content
4. Using more concise formatting

---

## Common Mistakes to Avoid

### ❌ Don't Do This
```markdown
<!-- In README.md -->
## Rate Limiting Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| RATE_LIMIT_GENERAL_MAX | ... | 100 |
| RATE_LIMIT_GENERAL_WINDOW_MS | ... | 900000 |
[... 10 more variables ...]
```

### ✅ Do This Instead
```markdown
<!-- In README.md -->
## Rate Limiting
Rate limiting is enabled by default. See [Security Guide](docs/SECURITY.md) 
for configuration options.
```

---

## Maintenance Schedule

### Monthly
- [ ] Review for outdated information
- [ ] Check all links are working
- [ ] Verify code examples still work
- [ ] Update version numbers if needed

### Quarterly
- [ ] Review file sizes
- [ ] Check for duplicate content
- [ ] Update screenshots if UI changed
- [ ] Review and update troubleshooting sections

### On Major Release
- [ ] Update all version references
- [ ] Review all documentation for accuracy
- [ ] Update "Last Updated" dates
- [ ] Add changelog entries

---

**Last Updated**: November 2025
