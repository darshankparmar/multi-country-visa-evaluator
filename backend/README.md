# Visa Evaluation Backend API

A comprehensive multi-country visa evaluation system that enables users to submit visa applications, receive AI-powered or rule-based evaluation scores, and allows immigration law partners to access submitted evaluations through secure API keys.

## Project Overview

This backend API system processes visa evaluation requests for multiple countries, handles document uploads, stores evaluation data in MongoDB, and provides configurable scoring mechanisms with a maximum success cap. The system is designed with a layered architecture following best practices for maintainability, scalability, and security.

### Key Objectives

- **Multi-Country Support**: Evaluate visa applications for 6+ countries including Ireland, Poland, France, Netherlands, Germany, and United States
- **Flexible Evaluation**: Support both rule-based and AI-powered (OpenAI) evaluation strategies
- **Partner Integration**: Enable immigration law firms to integrate via secure API keys
- **Document Management**: Handle multiple document types with secure storage
- **Email Notifications**: Send evaluation results to applicants automatically
- **Configurable Scoring**: Apply customizable success cap to evaluation scores

## Technology Stack

### Core Technologies
- **Runtime**: Node.js v18+
- **Language**: TypeScript 5.3+
- **Framework**: Express.js 4.x
- **Database**: MongoDB 6+ with Mongoose ODM 8.x

### Key Dependencies
- **Validation**: Zod 3.22+ for type-safe schema validation
- **File Upload**: Multer 1.4+ for multipart/form-data handling
- **AI Integration**: OpenAI SDK 4.20+ (optional)
- **Email**: Nodemailer 6.9+ with SMTP transport
- **Logging**: Winston 3.11+ for structured logging
- **Security**: CORS, crypto for API key generation

### Development Tools
- **Build**: TypeScript Compiler (tsc)
- **Dev Server**: tsx with watch mode
- **Process Manager**: PM2 (recommended for production)

## Prerequisites

Before installing and running the application, ensure you have:

- **Node.js**: Version 18.0.0 or higher ([Download](https://nodejs.org/))
- **MongoDB**: Version 6.0 or higher ([Installation Guide](https://docs.mongodb.com/manual/installation/))
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **OpenAI API Key**: Required only if using AI-based evaluation (optional)
- **SMTP Server**: Required only if email notifications are enabled (optional)

### System Requirements
- **Memory**: Minimum 512MB RAM (1GB+ recommended)
- **Storage**: 1GB+ free disk space for uploads and logs
- **OS**: Windows, macOS, or Linux

## Installation

Follow these steps to set up the backend API:

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies listed in `package.json`.

### 3. Configure Environment Variables

Create your environment configuration file:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration (see Environment Variables section below for details).

### 4. Start MongoDB

Ensure MongoDB is running on your system:

```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
# Start MongoDB service from Services panel or run mongod.exe
```

### 5. Seed the Database

Populate the database with initial visa type data:

```bash
npm run seed
```

This creates visa types for 6 countries with their required documents.

### 6. Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000` (or your configured PORT).

## Environment Variables

Configure the following environment variables in your `.env` file. Copy `.env.example` to `.env` and update values as needed.

### Essential Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/visa-evaluation` | Yes |
| `EVALUATOR_TYPE` | Evaluation strategy: `rule-based` or `ai` | `rule-based` | No |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3000,http://localhost:5173` | No |

### AI Configuration (if EVALUATOR_TYPE=ai)

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | - |
| `AI_MODEL` | OpenAI model | `gpt-4` |
| `USE_MOCK_AI` | Use mock responses (testing) | `false` |

### Security & Rate Limiting

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_API_KEY` | Admin authentication key | - |
| `RATE_LIMIT_GENERAL_MAX` | General API requests per 15 min | `100` |
| `RATE_LIMIT_EVALUATION_MAX` | Evaluations per hour | `10` |

### Complete Configuration Reference

For a complete list of all environment variables including timeouts, email, and advanced settings, see the [`.env.example`](.env.example) file or [Deployment Guide](docs/DEPLOYMENT.md).

## Features

### AI-Powered Evaluation
- Document content analysis (PDF, DOCX, TXT)
- Weighted category scoring across 5 dimensions
- Detailed recommendations and conclusions
- Mock mode for cost-free testing

### Security
- NoSQL injection prevention
- Email validation (RFC 5322 compliant)
- File type validation (MIME + magic numbers)
- PII sanitization in logs
- Security headers (HSTS, CSP, XSS protection)
- Multi-layer timeout protection

### Rate Limiting
- IP-based limits for public endpoints
- API key-based limits for partners
- Configurable thresholds per endpoint type
- Automatic cleanup and sliding window algorithm

For detailed information, see:
- **[AI Evaluation Guide](docs/AI_EVALUATION_GUIDE.md)**: AI features and configuration
- **[Security Guide](docs/SECURITY.md)**: Complete security documentation
- **[API Documentation](docs/API.md)**: Endpoint specifications



## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production build |
| `npm run seed` | Seed database with visa type data |

### Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration modules
│   │   ├── database.ts      # MongoDB connection setup
│   │   ├── environment.ts   # Environment validation with Zod
│   │   ├── logger.ts        # Winston logger configuration
│   │   └── scoringCategories.ts  # Weighted scoring configuration
│   ├── controllers/         # Request handlers
│   │   ├── evaluationController.ts
│   │   ├── partnerController.ts
│   │   └── visaTypeController.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # Partner API key authentication
│   │   ├── errorHandler.ts # Global error handling
│   │   ├── requestLogger.ts # Request/response logging
│   │   ├── upload.ts        # Multer file upload configuration
│   │   └── validation.ts    # Zod request validation
│   ├── models/              # Mongoose schemas
│   │   ├── Evaluation.ts    # Evaluation data model
│   │   ├── Partner.ts       # Partner/API key model
│   │   └── VisaType.ts      # Visa type configuration model
│   ├── repositories/        # Data access layer
│   │   ├── evaluationRepository.ts
│   │   ├── partnerRepository.ts
│   │   └── visaTypeRepository.ts
│   ├── routes/              # API route definitions
│   │   ├── index.ts         # Route aggregator
│   │   ├── evaluations.ts   # Evaluation endpoints
│   │   ├── partners.ts      # Partner management endpoints
│   │   └── visaTypes.ts     # Visa type query endpoints
│   ├── services/            # Business logic layer
│   │   ├── evaluationService.ts  # Core evaluation workflow
│   │   ├── emailService.ts       # Email notifications
│   │   ├── fileService.ts        # Document storage
│   │   ├── documentParser.ts     # Document text extraction
│   │   └── evaluators/           # Evaluation strategies
│   │       ├── evaluatorInterface.ts
│   │       ├── ruleBasedEvaluator.ts
│   │       ├── aiEvaluator.ts
│   │       ├── mockAIResponses.ts
│   │       └── evaluatorFactory.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── express.d.ts     # Express type extensions
│   │   ├── evaluation.types.ts
│   │   ├── partner.types.ts
│   │   └── visaType.types.ts
│   ├── utils/               # Utility functions
│   │   ├── apiResponse.ts   # Standardized API responses
│   │   └── errors.ts        # Custom error classes
│   └── seeders/             # Database seeders
│       └── visaTypeSeeder.ts
├── uploads/                 # Uploaded document storage
├── dist/                    # Compiled JavaScript output
├── logs/                    # Application logs
├── .env.example             # Environment template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── server.ts                # Application entry point
```

## Production Deployment

For production deployment, see the **[Deployment Guide](docs/DEPLOYMENT.md)** which covers:
- MongoDB setup (Atlas or self-hosted)
- PM2 process management
- Nginx reverse proxy configuration
- SSL/HTTPS setup
- Monitoring and logging
- Backup strategies
- Security hardening

**Quick Start**:
```bash
npm run build
export NODE_ENV=production
pm2 start dist/server.js --name visa-api
```

## API Overview

The API follows RESTful conventions with consistent JSON responses.

### Base URL
```
http://localhost:3000/api
```

### Quick Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/evaluations` | POST | Optional | Submit visa evaluation |
| `/api/evaluations/:id` | GET | No | Get evaluation by ID |
| `/api/evaluations` | GET | Required | List partner evaluations |
| `/api/visa-types` | GET | No | List all visa types |
| `/api/visa-types/:country` | GET | No | Get visa types by country |
| `/api/partners` | POST | Admin | Create partner |
| `/api/partners` | GET | Admin | List partners |
| `/api/partners/:id/status` | PATCH | Admin | Update partner status |
| `/health` | GET | No | Health check |

**Note**: For detailed partner API documentation, see the Partner API Guide page in the frontend application at `/partner-api-guide`.

For detailed API documentation with request/response examples, see [docs/API.md](docs/API.md).

## Authentication

Partner endpoints require API key authentication via the `x-api-key` header:

```bash
curl -H "x-api-key: your-api-key-here" \
     http://localhost:3000/api/evaluations
```

### Generating Partner API Keys

To create and manage partner API keys, see the **[Partner API Key Generation Guide](docs/PARTNER_API_KEY_GUIDE.md)** for step-by-step instructions.

Quick example:
```bash
curl -X POST http://localhost:3000/api/partners \
     -H "Content-Type: application/json" \
     -d '{"name":"Law Firm Name","email":"contact@lawfirm.com"}'
```

## Git Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification:

- **feat**: New features (e.g., `feat: add AI-based evaluator`)
- **fix**: Bug fixes (e.g., `fix: correct score calculation`)
- **docs**: Documentation changes (e.g., `docs: update API examples`)
- **chore**: Maintenance tasks (e.g., `chore: update dependencies`)
- **test**: Test additions or modifications (e.g., `test: add evaluation service tests`)
- **refactor**: Code refactoring (e.g., `refactor: simplify error handling`)
- **style**: Code style changes (e.g., `style: format with prettier`)
- **perf**: Performance improvements (e.g., `perf: optimize database queries`)

### Commit Message Format
```
<type>: <description>

[optional body]

[optional footer]
```

**Example**:
```
feat: implement email notification service

Add Nodemailer integration for sending evaluation results to users.
Includes HTML email template and error handling.
```

## Troubleshooting

### Quick Fixes

| Issue | Solution |
|-------|----------|
| MongoDB connection failed | Ensure MongoDB is running, check `MONGODB_URI` in `.env` |
| Port already in use | Change `PORT` in `.env` or kill process using the port |
| File upload fails | Check `MAX_FILE_SIZE` and file type restrictions |
| AI evaluator not working | Set `OPENAI_API_KEY` or enable `USE_MOCK_AI=true` |
| Email not sending | Verify SMTP credentials, use App Password for Gmail |

### Detailed Troubleshooting

For comprehensive troubleshooting guides, see:
- **[AI Evaluation Guide](docs/AI_EVALUATION_GUIDE.md#troubleshooting)**: AI and document parsing issues
- **[Deployment Guide](docs/DEPLOYMENT.md#troubleshooting)**: Production deployment issues
- **[Security Guide](docs/SECURITY.md)**: Security configuration issues

## Documentation

### Core Guides
- **[API Documentation](docs/API.md)**: Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Production setup
- **[Security Guide](docs/SECURITY.md)**: Security features and best practices
- **[Architecture Guide](docs/ARCHITECTURE.md)**: System design

### Feature Guides
- **[AI Evaluation Guide](docs/AI_EVALUATION_GUIDE.md)**: AI-powered evaluation
- **[Partner API Key Guide](docs/PARTNER_API_KEY_GUIDE.md)**: Partner integration
- **[Mock AI Mode](docs/MOCK_AI_MODE.md)**: Testing without API costs
- **[Scoring Configuration](docs/SCORING_CONFIGURATION.md)**: Category weights

### Additional Resources
- **[Documentation Index](docs/README.md)**: Complete documentation overview
- **[Future Enhancements](docs/FUTURE_ENHANCEMENTS.md)**: Planned features

---

**Version**: 1.0.0  
**Last Updated**: November 2025
