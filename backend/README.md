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

Configure the following environment variables in your `.env` file:

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `3000` | No |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` | No |

### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/visa-evaluation` | Yes |
| `MONGODB_TEST_URI` | MongoDB test database connection string | `mongodb://localhost:27017/visa-evaluation-test` | No |

**Example**: `mongodb://username:password@host:port/database`

### File Upload Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `UPLOAD_DIR` | Directory for storing uploaded documents | `./uploads` | No |
| `MAX_FILE_SIZE` | Maximum file size in bytes (5MB default) | `5242880` | No |

### Evaluation Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SUCCESS_CAP` | Maximum evaluation score (0-100) | `85` | No |
| `EVALUATOR_TYPE` | Evaluation strategy: `rule-based` or `ai` | `rule-based` | No |

**Note**: The success cap ensures no evaluation score exceeds the configured threshold, providing realistic expectations.

### AI Service Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI-based evaluation | - | Yes (if `EVALUATOR_TYPE=ai`) |
| `AI_MODEL` | OpenAI model to use | `gpt-4` | No |
| `ENABLE_DOCUMENT_PARSING` | Enable text extraction from documents | `true` | No |
| `MAX_DOCUMENT_TEXT_LENGTH` | Maximum characters per document | `10000` | No |
| `PARSING_TIMEOUT` | Document parsing timeout (ms) | `30000` | No |
| `AI_TEMPERATURE` | OpenAI temperature parameter (0-1) | `0.7` | No |
| `AI_MAX_TOKENS` | Maximum tokens for OpenAI response | `2000` | No |
| `AI_RETRY_ATTEMPTS` | Number of retry attempts for OpenAI API | `2` | No |
| `USE_MOCK_AI` | Use mock AI responses (testing only) | `false` | No |

**Note**: Only required when `EVALUATOR_TYPE` is set to `ai`. Get your API key from [OpenAI Platform](https://platform.openai.com/).

**Document Parsing**: When enabled, extracts text from PDF, DOCX, and TXT files for content analysis.

**Mock Mode**: Set `USE_MOCK_AI=true` for testing without API costs. See [Mock AI Mode Guide](docs/MOCK_AI_MODE.md).

### Email Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMTP_ENABLED` | Enable/disable email notifications | `false` | No |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` | Yes (if enabled) |
| `SMTP_PORT` | SMTP server port | `587` | Yes (if enabled) |
| `SMTP_USER` | SMTP authentication username | - | Yes (if enabled) |
| `SMTP_PASS` | SMTP authentication password | - | Yes (if enabled) |
| `SMTP_FROM` | Sender email address | `noreply@visaeval.com` | Yes (if enabled) |

**Gmail Users**: Use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

### Security Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_KEY_LENGTH` | Length of generated partner API keys | `32` | No |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:3000,http://localhost:5173` | No |

**Example**: `CORS_ORIGINS=https://app.example.com,https://admin.example.com`

### Logging Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Winston log level (`error`, `warn`, `info`, `debug`) | `info` | No |

## AI Evaluation Enhancement

The system supports AI-powered evaluation with document content analysis and weighted category scoring.

### Key Features

- **Document Content Analysis**: Extracts and analyzes text from PDF, DOCX, and TXT files
- **Weighted Category Scoring**: Evaluates across 5 categories (Professional Qualifications, Financial Stability, Documentation Quality, Language Proficiency, Country-Specific Requirements)
- **Detailed Recommendations**: Provides specific, actionable suggestions for improvement
- **Mock Mode**: Cost-free testing without OpenAI API calls

### Quick Start

```bash
# Enable AI evaluation
EVALUATOR_TYPE=ai
OPENAI_API_KEY=sk-your-key-here
ENABLE_DOCUMENT_PARSING=true

# Or use mock mode for testing
USE_MOCK_AI=true
```

### Enhanced Response Format

```json
{
  "score": 78,
  "summary": "Strong application with comprehensive documentation...",
  "recommendations": ["Obtain additional reference letters...", "..."],
  "conclusion": "This application shows strong potential for approval..."
}
```

For detailed information, see:
- **[AI Evaluation Guide](docs/AI_EVALUATION_GUIDE.md)**: Complete guide with examples and troubleshooting
- **[Scoring Configuration](docs/SCORING_CONFIGURATION.md)**: How to configure category weights
- **[Mock AI Mode](docs/MOCK_AI_MODE.md)**: Testing without API costs

## Development

### Running the Development Server

Start the server with hot-reload enabled:

```bash
npm run dev
```

The server will automatically restart when you make changes to TypeScript files.



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
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── server.ts                # Application entry point
└── README.md                # This file
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript in `dist/` |
| `npm start` | Run compiled production build |
| `npm run seed` | Seed database with initial visa type data |

## Production Deployment

### Building for Production

1. **Compile TypeScript**:
```bash
npm run build
```

This creates optimized JavaScript files in the `dist/` directory.

2. **Set Production Environment**:
```bash
export NODE_ENV=production
```

3. **Configure Production Environment Variables**:
Update your `.env` file with production values:
- Use production MongoDB URI (consider MongoDB Atlas)
- Set appropriate CORS origins
- Enable SMTP for email notifications
- Use `ai` evaluator type if desired
- Set `LOG_LEVEL=warn` or `LOG_LEVEL=error`

### Running in Production

#### Option 1: Direct Node.js

```bash
npm start
```

#### Option 2: PM2 Process Manager (Recommended)

Install PM2 globally:
```bash
npm install -g pm2
```

Start the application:
```bash
pm2 start dist/server.js --name visa-api
```

Useful PM2 commands:
```bash
pm2 status              # Check status
pm2 logs visa-api       # View logs
pm2 restart visa-api    # Restart application
pm2 stop visa-api       # Stop application
pm2 startup             # Enable auto-start on system boot
pm2 save                # Save current process list
```

#### Option 3: Docker (Alternative)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY uploads ./uploads
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

Build and run:
```bash
docker build -t visa-api .
docker run -p 3000:3000 --env-file .env visa-api
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production MongoDB URI with authentication
- [ ] Configure CORS with specific allowed origins
- [ ] Enable HTTPS/SSL (use reverse proxy like Nginx)
- [ ] Set up MongoDB backups
- [ ] Configure log rotation
- [ ] Set up monitoring (health check endpoint available at `/health`)
- [ ] Implement rate limiting (future enhancement)
- [ ] Review and secure all environment variables
- [ ] Test email notifications
- [ ] Verify file upload limits and storage

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

### Common Issues

#### MongoDB Connection Failed

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solutions**:
- Ensure MongoDB is running: `mongod --version`
- Check connection string in `.env`
- Verify MongoDB is listening on the correct port (default: 27017)
- Check firewall settings

#### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
- Change `PORT` in `.env` to a different value
- Kill the process using the port:
  ```bash
  # Find process
  lsof -i :3000  # macOS/Linux
  netstat -ano | findstr :3000  # Windows
  
  # Kill process
  kill -9 <PID>  # macOS/Linux
  taskkill /PID <PID> /F  # Windows
  ```

#### File Upload Fails

**Error**: `MulterError: File too large`

**Solutions**:
- Check `MAX_FILE_SIZE` in `.env` (default: 5MB)
- Ensure `uploads/` directory exists and has write permissions
- Verify file MIME type is allowed

#### AI Evaluator Not Working

**Error**: `OpenAI API key not configured`

**Solutions**:
- Set `OPENAI_API_KEY` in `.env`
- Verify API key is valid at [OpenAI Platform](https://platform.openai.com/)
- Check OpenAI account has available credits
- Ensure `EVALUATOR_TYPE=ai` in `.env`
- Try enabling mock mode for testing: `USE_MOCK_AI=true`

#### Document Parsing or AI Issues

For detailed troubleshooting of AI evaluation, document parsing, rate limits, and response issues, see the [AI Evaluation Guide](docs/AI_EVALUATION_GUIDE.md#troubleshooting).

#### Email Not Sending

**Error**: `Email send failed`

**Solutions**:
- Verify `SMTP_ENABLED=true` in `.env`
- Check SMTP credentials are correct
- For Gmail, use an App Password instead of regular password
- Check SMTP server allows connections from your IP
- Review logs for specific error messages

#### TypeScript Compilation Errors

**Error**: `error TS2307: Cannot find module`

**Solutions**:
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `package-lock.json`, then run `npm install`
- Check `tsconfig.json` configuration
- Ensure TypeScript version is 5.3+

### Logging and Debugging

View application logs:
```bash
# Development mode (console output)
npm run dev

# Production mode (check log files)
tail -f logs/error.log
tail -f logs/combined.log
```

Enable debug logging:
```bash
# In .env
LOG_LEVEL=debug
```

### Getting Help

If you encounter issues not covered here:

1. Check the [Architecture Documentation](docs/ARCHITECTURE.md) for system design details
2. Review the [API Documentation](docs/API.md) for endpoint specifications
3. Consult the [Deployment Guide](docs/DEPLOYMENT.md) for production setup
4. Check application logs for detailed error messages

## Additional Documentation

- **[API Documentation](docs/API.md)**: Detailed endpoint specifications with examples
- **[Partner API Key Guide](docs/PARTNER_API_KEY_GUIDE.md)**: Step-by-step guide for generating and managing partner API keys
- **[AI Evaluation Guide](docs/AI_EVALUATION_GUIDE.md)**: Comprehensive guide for AI-powered evaluation with document parsing
- **[Architecture Guide](docs/ARCHITECTURE.md)**: System design and data flow
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Production deployment instructions
- **[Requirements Mapping](docs/REQUIREMENTS_MAPPING.md)**: Traceability matrix
- **[Future Enhancements](docs/FUTURE_ENHANCEMENTS.md)**: Planned features and improvements

## License

ISC

---

**Version**: 1.0.0  
**Last Updated**: November 2025
