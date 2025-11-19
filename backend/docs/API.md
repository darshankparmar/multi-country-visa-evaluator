# API Documentation

## Overview

The Visa Evaluation Backend API provides RESTful endpoints for submitting visa evaluations, querying visa types, and managing partner integrations. All endpoints return JSON responses with consistent structure.

**Base URL**: `http://localhost:3000/api`

**API Version**: 1.0.0

## Response Format

### Success Response

```json
{
  "status": "success",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    // Optional validation errors array
  ]
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid API key |
| 404 | Not Found - Resource not found |
| 408 | Request Timeout - Request exceeded 30 second limit |
| 500 | Internal Server Error - Server error occurred |

## Authentication

Partner-specific endpoints require API key authentication via the `x-api-key` header.

**Header Format**:
```
x-api-key: your-32-character-api-key-here
```

**Example**:
```bash
curl -H "x-api-key: abc123def456..." \
     http://localhost:3000/api/evaluations
```

### Obtaining an API Key

Contact the system administrator to create a partner account. API keys are generated using cryptographically secure random bytes.

## Endpoints

### Health Check

Check API service status and database connectivity.

**Endpoint**: `GET /health`

**Authentication**: None

**Response**:
```json
{
  "status": "success",
  "data": {
    "service": "visa-evaluation-api",
    "status": "healthy",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 3600,
    "timestamp": "2025-11-17T10:30:00.000Z",
    "database": {
      "status": "connected",
      "name": "visa-evaluation"
    }
  }
}
```

**cURL Example**:
```bash
curl http://localhost:3000/health
```

---

## Evaluation Endpoints

### Submit Visa Evaluation

Submit a new visa evaluation with user information and documents.

**Endpoint**: `POST /api/evaluations`

**Authentication**: Optional (include `x-api-key` to associate with partner)

**Content-Type**: `multipart/form-data`

**Request Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Applicant's full name |
| email | string | Yes | Applicant's email address |
| country | string | Yes | Target country (e.g., "Ireland") |
| visaType | string | Yes | Visa type name (e.g., "Critical Skills Employment Permit") |
| documents | file[] | Yes | Array of document files (max 5MB each) |

**Partner Association**:

When the `x-api-key` header is provided with a valid partner API key, the evaluation will be automatically associated with that partner. This allows partners to:
- Track evaluations submitted through their integration
- Retrieve all their associated evaluations via `GET /api/evaluations`
- Monitor conversion rates and user engagement

Evaluations submitted without an API key are still processed normally but are not associated with any partner.

**Request Example (Public Submission)**:
```bash
curl -X POST http://localhost:3000/api/evaluations \
  -F "name=John Doe" \
  -F "email=john.doe@example.com" \
  -F "country=Ireland" \
  -F "visaType=Critical Skills Employment Permit" \
  -F "documents=@resume.pdf" \
  -F "documents=@personal_statement.pdf" \
  -F "documents=@employment_contract.pdf"
```

**Request Example (Partner Submission)**:
```bash
curl -X POST http://localhost:3000/api/evaluations \
  -H "x-api-key: your-api-key-here" \
  -F "name=John Doe" \
  -F "email=john.doe@example.com" \
  -F "country=Ireland" \
  -F "visaType=Critical Skills Employment Permit" \
  -F "documents=@resume.pdf" \
  -F "documents=@personal_statement.pdf"
```

**Success Response** (201 Created):
```json
{
  "status": "success",
  "data": {
    "evaluationId": "550e8400-e29b-41d4-a716-446655440000",
    "score": 78,
    "summary": "Your application shows strong potential for the Ireland Critical Skills Employment Permit. You have submitted 3 of 4 required documents. Consider adding police clearance certificate to strengthen your application. Your employment contract demonstrates the required skill level and salary threshold.",
    "recommendations": [
      "Obtain police clearance certificate to complete required documentation",
      "Include additional reference letters from previous employers",
      "Provide certified translations for any non-English documents"
    ],
    "conclusion": "This application demonstrates good approval potential. The candidate meets most requirements with solid supporting documentation. Addressing the missing police clearance certificate would strengthen the application significantly.",
    "criteriaAnalysis": [
      {
        "name": "Salary Requirement",
        "rating": "GOOD",
        "evidence": [
          "Employment contract shows €45,000 annual salary",
          "Exceeds minimum threshold of €38,000 for critical occupations"
        ],
        "gaps": [],
        "recommendation": null,
        "isCritical": true
      },
      {
        "name": "Education Requirement",
        "rating": "STRONG",
        "evidence": [
          "Bachelor's degree in Computer Science from recognized university",
          "Degree certificate provided and verified"
        ],
        "gaps": [],
        "recommendation": null,
        "isCritical": true
      },
      {
        "name": "Sponsor",
        "rating": "GOOD",
        "evidence": [
          "Employment contract from registered Irish employer"
        ],
        "gaps": [],
        "recommendation": null,
        "isCritical": true
      }
    ],
    "prioritizedRecommendations": [
      {
        "priority": "HIGH",
        "text": "Obtain police clearance certificate to complete required documentation",
        "relatedCriterion": "Documentation"
      },
      {
        "priority": "MEDIUM",
        "text": "Include additional reference letters from previous employers",
        "relatedCriterion": "Experience"
      },
      {
        "priority": "LOW",
        "text": "Provide certified translations for any non-English documents",
        "relatedCriterion": "Documentation"
      }
    ],
    "scoreBreakdown": {
      "baseScore": 78,
      "penalties": [],
      "totalPenalty": 0,
      "adjustedScore": 78,
      "breakdown": [
        {
          "criterion": "Salary Requirement",
          "points": 35,
          "maxPoints": 35,
          "percentage": 100
        },
        {
          "criterion": "Education Requirement",
          "points": 25,
          "maxPoints": 25,
          "percentage": 100
        },
        {
          "criterion": "Experience",
          "points": 12,
          "maxPoints": 15,
          "percentage": 80
        },
        {
          "criterion": "Documentation",
          "points": 6,
          "maxPoints": 15,
          "percentage": 40
        }
      ]
    },
    "approvalLikelihood": "Good",
    "userInfo": {
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "visaApplication": {
      "country": "Ireland",
      "visaType": "Critical Skills Employment Permit"
    },
    "createdAt": "2025-11-17T10:30:00.000Z"
  }
}
```

**Structured Response Fields** (Available for visa-specific evaluations):

| Field | Type | Description |
|-------|------|-------------|
| criteriaAnalysis | array | Detailed analysis of each criterion with rating, evidence, and gaps |
| prioritizedRecommendations | array | Recommendations sorted by priority (CRITICAL, HIGH, MEDIUM, LOW) |
| scoreBreakdown | object | Detailed score calculation showing base score, penalties, and breakdown |
| approvalLikelihood | string | Overall approval likelihood assessment |
| validationResults | array | Raw validation data (not shown in response but available internally) |

**Criterion Rating Values**:
- `STRONG`: Requirement exceeded expectations
- `GOOD`: Requirement fully met
- `MODERATE`: Requirement partially met
- `WEAK`: Requirement not adequately met
- `CRITICAL_GAP`: Critical requirement missing (significantly impacts approval)

**Recommendation Priority Levels**:
- `CRITICAL`: Must be addressed for visa approval (e.g., missing LCA for H-1B)
- `HIGH`: Important gaps that significantly impact approval chances
- `MEDIUM`: Recommended improvements to strengthen application
- `LOW`: Optional enhancements

**Note**: Structured fields (`criteriaAnalysis`, `prioritizedRecommendations`, `scoreBreakdown`, `approvalLikelihood`) are included when the visa type has specific criteria configured (e.g., H-1B Visa, Critical Skills Employment Permit). For generic evaluations or visa types without specific criteria, only basic fields (`score`, `summary`, `recommendations`, `conclusion`) are returned.

**Note**: The response does not include the `partnerId` field for privacy reasons, but the evaluation is internally associated with the partner if an API key was provided.

**Error Response** (400 Bad Request):
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "documents",
      "message": "At least one document is required"
    }
  ]
}
```

**Error Response** (400 - Invalid Visa Type):
```json
{
  "status": "error",
  "message": "Visa type 'Invalid Visa' not found for country 'Ireland'"
}
```

**Notes**:
- Maximum file size: 5MB per file
- Allowed file types: PDF, DOC, DOCX, JPG, JPEG, PNG
- Request timeout: 30 seconds
- Email notification sent automatically if SMTP is configured
- Score is capped at configured SUCCESS_CAP (default: 85)
- If `x-api-key` header is provided, the evaluation is associated with the partner for tracking purposes

---

### Get Evaluation by ID

Retrieve a specific evaluation by its ID.

**Endpoint**: `GET /api/evaluations/:id`

**Authentication**: None

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Evaluation ID (UUID format) |

**Request Example**:
```bash
curl http://localhost:3000/api/evaluations/550e8400-e29b-41d4-a716-446655440000
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "evaluationId": "550e8400-e29b-41d4-a716-446655440000",
    "userInfo": {
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "visaApplication": {
      "country": "Ireland",
      "visaType": "Critical Skills Employment Permit"
    },
    "documents": [
      {
        "filename": "1700220600000-resume.pdf",
        "originalName": "resume.pdf",
        "uploadedAt": "2025-11-17T10:30:00.000Z"
      },
      {
        "filename": "1700220600001-personal_statement.pdf",
        "originalName": "personal_statement.pdf",
        "uploadedAt": "2025-11-17T10:30:00.000Z"
      }
    ],
    "results": {
      "score": 78,
      "summary": "Your application shows strong potential...",
      "recommendations": [
        "Consider obtaining additional reference letters",
        "Include more recent financial statements",
        "Provide certified translations for non-English documents"
      ],
      "conclusion": "This application shows good approval potential with comprehensive documentation.",
      "evaluatedAt": "2025-11-17T10:30:05.000Z",
      "criteriaAnalysis": [
        {
          "name": "Salary Requirement",
          "rating": "GOOD",
          "evidence": ["Employment contract shows €45,000 annual salary"],
          "gaps": [],
          "isCritical": true
        },
        {
          "name": "Education Requirement",
          "rating": "STRONG",
          "evidence": ["Bachelor's degree in Computer Science"],
          "gaps": [],
          "isCritical": true
        }
      ],
      "prioritizedRecommendations": [
        {
          "priority": "HIGH",
          "text": "Consider obtaining additional reference letters",
          "relatedCriterion": "Experience"
        },
        {
          "priority": "MEDIUM",
          "text": "Include more recent financial statements",
          "relatedCriterion": "Documentation"
        }
      ],
      "scoreBreakdown": {
        "baseScore": 78,
        "penalties": [],
        "totalPenalty": 0,
        "adjustedScore": 78,
        "breakdown": [
          {
            "criterion": "Salary Requirement",
            "points": 35,
            "maxPoints": 35,
            "percentage": 100
          }
        ]
      },
      "approvalLikelihood": "Good",
      "validationResults": [
        {
          "criterion": "Salary Requirement",
          "met": true,
          "score": 35,
          "maxScore": 35,
          "details": "Salary meets threshold requirement",
          "isCritical": true,
          "evidence": ["€45,000 annual salary"],
          "sourceDocument": "employment_contract.pdf"
        }
      ]
    },
    "createdAt": "2025-11-17T10:30:00.000Z",
    "updatedAt": "2025-11-17T10:30:05.000Z"
  }
}
```

**Note**: Structured fields (`criteriaAnalysis`, `prioritizedRecommendations`, `scoreBreakdown`, `approvalLikelihood`, `validationResults`) are available when the visa type has specific criteria configured. These fields provide detailed criterion-by-criterion analysis with evidence extraction, penalty tracking, and realistic approval likelihood assessment.

**Error Response** (404 Not Found):
```json
{
  "status": "error",
  "message": "Evaluation not found"
}
```

---

### List Partner Evaluations

Retrieve all evaluations associated with a partner's API key. This endpoint returns only evaluations that were submitted with the partner's API key in the `x-api-key` header during the `POST /api/evaluations` request.

**Endpoint**: `GET /api/evaluations`

**Authentication**: Required (x-api-key header)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 20 | Number of results per page (max: 100) |
| startDate | string | No | - | Filter by creation date (ISO 8601 format) |
| endDate | string | No | - | Filter by creation date (ISO 8601 format) |

**Partner Association**:

Only evaluations that were submitted with the partner's API key will be returned. Evaluations submitted without an API key or with a different partner's API key will not be included in the results.

**Request Example**:
```bash
curl -H "x-api-key: your-api-key-here" \
     "http://localhost:3000/api/evaluations?page=1&limit=10"
```

**With Date Filtering**:
```bash
curl -H "x-api-key: your-api-key-here" \
     "http://localhost:3000/api/evaluations?startDate=2025-11-01&endDate=2025-11-30"
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "evaluations": [
      {
        "evaluationId": "550e8400-e29b-41d4-a716-446655440000",
        "userInfo": {
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "visaApplication": {
          "country": "Ireland",
          "visaType": "Critical Skills Employment Permit"
        },
        "documentCount": 3,
        "results": {
          "score": 78,
          "summary": "Your application shows strong potential...",
          "recommendations": ["Obtain police clearance certificate"],
          "conclusion": "Good approval potential",
          "evaluatedAt": "2025-11-17T10:30:05.000Z",
          "criteriaAnalysis": [
            {
              "name": "Salary Requirement",
              "rating": "GOOD",
              "evidence": ["€45,000 annual salary"],
              "gaps": [],
              "isCritical": true
            }
          ],
          "prioritizedRecommendations": [
            {
              "priority": "HIGH",
              "text": "Obtain police clearance certificate",
              "relatedCriterion": "Documentation"
            }
          ],
          "scoreBreakdown": {
            "baseScore": 78,
            "penalties": [],
            "totalPenalty": 0,
            "adjustedScore": 78
          },
          "approvalLikelihood": "Good"
        },
        "createdAt": "2025-11-17T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

**Note**: Each evaluation includes structured fields when available. The list view includes all the same structured data as the detail view for easy access to evaluation results without additional API calls.

**Error Response** (401 Unauthorized):
```json
{
  "status": "error",
  "message": "Invalid or missing API key"
}
```

---

## Visa Type Endpoints

### List All Visa Types

Retrieve all available visa types across all countries.

**Endpoint**: `GET /api/visa-types`

**Authentication**: None

**Request Example**:
```bash
curl http://localhost:3000/api/visa-types
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "_id": "673a1234567890abcdef1234",
      "country": "Ireland",
      "visaType": "Critical Skills Employment Permit",
      "requiredDocuments": [
        "resume",
        "personal_statement",
        "employment_contract",
        "education_certificates"
      ],
      "description": "For highly skilled workers in occupations on the Critical Skills list",
      "processingTime": "8-12 weeks",
      "active": true
    },
    {
      "_id": "673a1234567890abcdef1235",
      "country": "Poland",
      "visaType": "Work Permit Type C",
      "requiredDocuments": [
        "resume",
        "employment_contract",
        "passport_copy",
        "education_certificates"
      ],
      "description": "For foreign nationals employed by Polish companies",
      "processingTime": "4-6 weeks",
      "active": true
    }
  ]
}
```

---

### Get Visa Types by Country

Retrieve all visa types for a specific country.

**Endpoint**: `GET /api/visa-types/:country`

**Authentication**: None

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| country | string | Country name (case-sensitive) |

**Request Example**:
```bash
curl http://localhost:3000/api/visa-types/Ireland
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "_id": "673a1234567890abcdef1234",
      "country": "Ireland",
      "visaType": "Critical Skills Employment Permit",
      "requiredDocuments": [
        "resume",
        "personal_statement",
        "employment_contract",
        "education_certificates"
      ],
      "description": "For highly skilled workers in occupations on the Critical Skills list",
      "processingTime": "8-12 weeks",
      "active": true
    },
    {
      "_id": "673a1234567890abcdef1236",
      "country": "Ireland",
      "visaType": "General Employment Permit",
      "requiredDocuments": [
        "resume",
        "employment_contract",
        "passport_copy"
      ],
      "description": "For employment in occupations not on the Critical Skills list",
      "processingTime": "10-14 weeks",
      "active": true
    }
  ]
}
```

**Error Response** (404 Not Found):
```json
{
  "status": "error",
  "message": "No visa types found for country 'InvalidCountry'"
}
```

**Supported Countries**:
- Ireland
- Poland
- France
- Netherlands
- Germany
- United States

---

## Partner Management Endpoints

### Create Partner

Create a new partner account with API key (Admin only).

**Endpoint**: `POST /api/partners`

**Authentication**: Admin (future implementation)

**Content-Type**: `application/json`

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Partner organization name |
| email | string | Yes | Partner contact email |
| contactInfo | object | No | Additional contact information |
| contactInfo.phone | string | No | Contact phone number |
| contactInfo.website | string | No | Partner website URL |

**Request Example**:
```bash
curl -X POST http://localhost:3000/api/partners \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Global Immigration Law Firm",
    "email": "contact@globalimmigration.com",
    "contactInfo": {
      "phone": "+1-555-0123",
      "website": "https://globalimmigration.com"
    }
  }'
```

**Success Response** (201 Created):
```json
{
  "status": "success",
  "data": {
    "partnerId": "673a1234567890abcdef5678",
    "name": "Global Immigration Law Firm",
    "email": "contact@globalimmigration.com",
    "apiKey": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "contactInfo": {
      "phone": "+1-555-0123",
      "website": "https://globalimmigration.com"
    },
    "active": true,
    "createdAt": "2025-11-17T10:30:00.000Z"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

**Important**: Store the API key securely. It cannot be retrieved later.

---

### List Partners

Retrieve all partner accounts (Admin only).

**Endpoint**: `GET /api/partners`

**Authentication**: Admin (future implementation)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Results per page |
| active | boolean | No | - | Filter by active status |

**Request Example**:
```bash
curl http://localhost:3000/api/partners?page=1&limit=10
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "partners": [
      {
        "partnerId": "673a1234567890abcdef5678",
        "name": "Global Immigration Law Firm",
        "email": "contact@globalimmigration.com",
        "apiKey": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
        "active": true,
        "createdAt": "2025-11-17T10:30:00.000Z",
        "evaluationCount": 145
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "pages": 1
    }
  }
}
```

---

### Update Partner Status

Activate or deactivate a partner account (Admin only).

**Endpoint**: `PATCH /api/partners/:id/status`

**Authentication**: Admin (future implementation)

**Content-Type**: `application/json`

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Partner ID (MongoDB ObjectId) |

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| active | boolean | Yes | Partner active status |

**Request Example**:
```bash
curl -X PATCH http://localhost:3000/api/partners/673a1234567890abcdef5678/status \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

**Success Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "partnerId": "673a1234567890abcdef5678",
    "name": "Global Immigration Law Firm",
    "active": false,
    "updatedAt": "2025-11-17T11:00:00.000Z"
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "status": "error",
  "message": "Partner not found"
}
```

**Note**: Deactivated partners cannot authenticate with their API key.

---

## File Upload Requirements

### Supported File Types

| Extension | MIME Type | Description |
|-----------|-----------|-------------|
| .pdf | application/pdf | PDF documents |
| .doc | application/msword | Word documents (legacy) |
| .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document | Word documents |
| .jpg, .jpeg | image/jpeg | JPEG images |
| .png | image/png | PNG images |

### File Size Limits

- **Per File**: 5MB maximum
- **Total Request**: 10MB maximum (including all files and form data)

### Upload Guidelines

1. Use `multipart/form-data` content type
2. Include files in `documents` field (array)
3. Ensure file names are descriptive
4. Files are stored with unique timestamps to prevent conflicts
5. Original filenames are preserved in metadata

### Error Responses

**File Too Large**:
```json
{
  "status": "error",
  "message": "File size exceeds maximum limit of 5MB"
}
```

**Invalid File Type**:
```json
{
  "status": "error",
  "message": "File type not allowed. Supported types: PDF, DOC, DOCX, JPG, PNG"
}
```

---

## Pagination

List endpoints support pagination with the following parameters:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| page | number | 1 | - | Page number (1-indexed) |
| limit | number | 20 | 100 | Results per page |

**Pagination Response Format**:
```json
{
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 145,
    "pages": 8
  }
}
```

---

## Rate Limiting

**Current Status**: Not implemented

**Future Implementation**: Rate limiting will be added to prevent abuse:
- 100 requests per 15 minutes per IP address
- 1000 requests per hour per API key
- Evaluation endpoint: 10 submissions per hour per email

Rate limit headers will be included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700221500
```

---

## Error Handling

### Common Error Scenarios

#### Validation Errors (400)

Occur when request data doesn't meet validation requirements.

**Example**:
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "country",
      "message": "Country is required"
    }
  ]
}
```

#### Authentication Errors (401)

Occur when API key is missing, invalid, or belongs to deactivated partner.

**Example**:
```json
{
  "status": "error",
  "message": "Invalid or missing API key"
}
```

#### Not Found Errors (404)

Occur when requested resource doesn't exist.

**Example**:
```json
{
  "status": "error",
  "message": "Evaluation not found"
}
```

#### Timeout Errors (408)

Occur when request processing exceeds 30 seconds (evaluation endpoints only).

**Example**:
```json
{
  "status": "error",
  "message": "Request timeout - evaluation processing took too long"
}
```

#### Server Errors (500)

Occur when unexpected server error happens.

**Example**:
```json
{
  "status": "error",
  "message": "Internal server error"
}
```

**Note**: In production, detailed error messages are hidden. Check server logs for details.

---

## Testing Examples

### Complete Evaluation Flow

```bash
# 1. Check available visa types
curl http://localhost:3000/api/visa-types/Ireland

# 2. Submit evaluation
curl -X POST http://localhost:3000/api/evaluations \
  -F "name=Jane Smith" \
  -F "email=jane.smith@example.com" \
  -F "country=Ireland" \
  -F "visaType=Critical Skills Employment Permit" \
  -F "documents=@resume.pdf" \
  -F "documents=@personal_statement.pdf" \
  -F "documents=@employment_contract.pdf" \
  -F "documents=@education_certificates.pdf"

# 3. Get evaluation result (use evaluationId from step 2)
curl http://localhost:3000/api/evaluations/550e8400-e29b-41d4-a716-446655440000
```

### Partner Integration Flow

```bash
# 1. Create partner account (admin)
curl -X POST http://localhost:3000/api/partners \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Immigration Services Inc",
    "email": "api@immigrationservices.com"
  }'

# 2. Submit evaluation with partner API key
curl -X POST http://localhost:3000/api/evaluations \
  -H "x-api-key: your-api-key-from-step-1" \
  -F "name=Client Name" \
  -F "email=client@example.com" \
  -F "country=Germany" \
  -F "visaType=EU Blue Card" \
  -F "documents=@resume.pdf"

# 3. List all partner evaluations
curl -H "x-api-key: your-api-key-from-step-1" \
     http://localhost:3000/api/evaluations?page=1&limit=20
```

---

## Postman Collection

A Postman collection with all endpoints and example requests is available for download:

**Collection URL**: [Coming Soon]

Import the collection into Postman and configure the following environment variables:
- `base_url`: `http://localhost:3000`
- `api_key`: Your partner API key

---

## Changelog

### Version 1.0.0 (November 2025)
- Initial API release
- Evaluation submission and retrieval
- Visa type queries
- Partner management
- File upload support
- Email notifications
- Rule-based and AI evaluation strategies

---

## Support

For API support and questions:
- **Documentation**: See [README.md](../README.md) for setup instructions
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup

---

## Related Documentation

- **[AI Evaluation Guide](AI_EVALUATION_GUIDE.md)**: Detailed guide for AI-powered evaluation features
- **[Scoring Configuration](SCORING_CONFIGURATION.md)**: Configure weighted category scoring
- **[Mock AI Mode](MOCK_AI_MODE.md)**: Testing without API costs
- **[Architecture Guide](ARCHITECTURE.md)**: System design and data flow

---

**Last Updated**: November 2025
