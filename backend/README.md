# Visa Evaluation Backend API

Multi-country visa evaluation backend system built with Node.js, Express, TypeScript, and MongoDB.

## Features

- Multi-country visa application evaluation
- Document upload and storage
- AI-powered or rule-based evaluation scoring
- Partner API key authentication
- Email notifications
- RESTful API design

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with appropriate values (see Environment Variables section below)

## Environment Variables

See `.env.example` for all available configuration options:

- **PORT**: Server port (default: 3000)
- **NODE_ENV**: Environment mode (development/production/test)
- **MONGODB_URI**: MongoDB connection string
- **SUCCESS_CAP**: Maximum evaluation score (0-100)
- **EVALUATOR_TYPE**: Evaluation strategy (rule-based/ai)
- **OPENAI_API_KEY**: Required if using AI evaluator
- **SMTP_***: Email configuration (optional)
- **CORS_ORIGINS**: Allowed frontend origins

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Seed Database
```bash
npm run seed
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose schemas
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── seeders/         # Database seeders
├── uploads/             # Uploaded documents
├── dist/                # Compiled JavaScript
└── server.ts            # Application entry point
```

## API Endpoints

### Evaluations
- `POST /api/evaluations` - Submit visa evaluation
- `GET /api/evaluations/:id` - Get evaluation by ID
- `GET /api/evaluations` - List evaluations (requires partner auth)

### Visa Types
- `GET /api/visa-types` - List all visa types
- `GET /api/visa-types/:country` - Get visa types by country

### Partners (Admin)
- `POST /api/partners` - Create partner with API key
- `GET /api/partners` - List all partners
- `PATCH /api/partners/:id/status` - Update partner status

### Health Check
- `GET /health` - Service health status

## Authentication

Partner endpoints require API key authentication via `x-api-key` header:

```bash
curl -H "x-api-key: your-api-key-here" http://localhost:3000/api/evaluations
```

## Git Commit Conventions

This project follows conventional commit messages:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `test:` - Test additions or modifications

## License

ISC
