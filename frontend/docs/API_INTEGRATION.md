# API Integration Guide

This guide explains how to connect the frontend application to the backend API and provides examples of all API interactions.

## Table of Contents

- [Configuration](#configuration)
- [API Client Setup](#api-client-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Configuration

### Backend Requirements

The frontend expects the backend API to be running and accessible. The backend should:

- Accept requests from the frontend origin (CORS configured)
- Run on the configured port (default: 3000)
- Expose endpoints under `/api` prefix
- Return responses in the format: `{ status: 'success', data: {...} }`

### Frontend Configuration

1. **Set the API Base URL**

   Create or edit `.env` file in the frontend root directory:

   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

   For production:
   ```env
   VITE_API_BASE_URL=https://your-api-domain.com/api
   ```

2. **Restart Development Server**

   After changing environment variables, restart the dev server:
   ```bash
   npm run dev
   ```

## API Client Setup

The application uses a configured Axios instance located in `src/api/client.ts`.

### Features

- **Base URL**: Configured via `VITE_API_BASE_URL` environment variable
- **Timeout**: 30 seconds for all requests
- **Request Logging**: Logs all requests in development mode
- **Response Unwrapping**: Automatically extracts data from backend response format
- **Error Handling**: Converts API errors to user-friendly messages

### Client Configuration

```typescript
// src/api/client.ts
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### Interceptors

**Request Interceptor**: Logs all outgoing requests
```typescript
apiClient.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
  return config
})
```

**Response Interceptor**: Unwraps responses and handles errors
```typescript
apiClient.interceptors.response.use(
  (response) => {
    // Extract data from { status: 'success', data: ... }
    if (response.data && response.data.status === 'success') {
      return response.data.data
    }
    return response.data
  },
  (error) => {
    // Convert to user-friendly error message
    const message = getErrorMessage(error)
    return Promise.reject(new Error(message))
  }
)
```

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the application.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Application name | `Country Visa Evaluator` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | `false` |
| `VITE_ENABLE_ERROR_REPORTING` | Enable error reporting | `false` |

### Accessing Environment Variables

```typescript
// In any TypeScript/JavaScript file
const apiUrl = import.meta.env.VITE_API_BASE_URL
const appName = import.meta.env.VITE_APP_NAME
```

## API Endpoints

### 1. Get All Countries

**Endpoint**: `GET /api/visa-types`

**Description**: Fetches all available visa types (used to extract unique countries)

**Request**:
```typescript
import { visaTypesApi } from './api/visaTypes'

const countries = await visaTypesApi.getCountries()
```

**Response**:
```json
[
  { "name": "United States" },
  { "name": "Ireland" },
  { "name": "Poland" },
  { "name": "France" },
  { "name": "Netherlands" },
  { "name": "Germany" }
]
```

### 2. Get Visa Types by Country

**Endpoint**: `GET /api/visa-types/:country`

**Description**: Fetches all visa types for a specific country

**Request**:
```typescript
import { visaTypesApi } from './api/visaTypes'

const visaTypes = await visaTypesApi.getVisaTypesByCountry('United States')
```

**Response**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "country": "United States",
    "visaType": "H-1B Work Visa",
    "requiredDocuments": [
      "Valid passport",
      "Employment letter",
      "Educational certificates"
    ],
    "description": "Temporary work visa for specialty occupations",
    "processingTime": "3-6 months",
    "active": true
  }
]
```

### 3. Submit Evaluation

**Endpoint**: `POST /api/evaluations`

**Description**: Submits a new visa evaluation with documents

**Content-Type**: `multipart/form-data`

**Request**:
```typescript
import { evaluationApi } from './api/evaluations'

const result = await evaluationApi.submitEvaluation({
  name: 'John Doe',
  email: 'john@example.com',
  country: 'United States',
  visaType: 'H-1B Work Visa',
  documents: [file1, file2] // File objects
})
```

**Form Data Structure**:
```
name: "John Doe"
email: "john@example.com"
country: "United States"
visaType: "H-1B Work Visa"
documents: [File, File, ...]
```

**Response**:
```json
{
  "evaluationId": "123e4567-e89b-12d3-a456-426614174000",
  "score": 85,
  "summary": "Strong candidate for H-1B Work Visa...",
  "userInfo": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "visaApplication": {
    "country": "United States",
    "visaType": "H-1B Work Visa"
  },
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### 4. Get Evaluation by ID

**Endpoint**: `GET /api/evaluations/:id`

**Description**: Retrieves an existing evaluation by its UUID

**Request**:
```typescript
import { evaluationApi } from './api/evaluations'

const evaluation = await evaluationApi.getEvaluationById(
  '123e4567-e89b-12d3-a456-426614174000'
)
```

**Response**:
```json
{
  "evaluationId": "123e4567-e89b-12d3-a456-426614174000",
  "userInfo": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "visaApplication": {
    "country": "United States",
    "visaType": "H-1B Work Visa"
  },
  "documents": [
    {
      "filename": "1642243800000-passport.pdf",
      "originalName": "passport.pdf",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "results": {
    "score": 85,
    "summary": "Strong candidate for H-1B Work Visa...",
    "evaluatedAt": "2024-01-15T10:30:05.000Z"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:05.000Z"
}
```

## Error Handling

### Error Response Format

The API client automatically converts errors to user-friendly messages.

### Common Error Scenarios

#### 1. Network Errors

**Scenario**: Backend is not running or unreachable

**Error Message**: "Unable to connect to the server. Please check your internet connection."

**Handling**:
```typescript
try {
  const result = await evaluationApi.submitEvaluation(data)
} catch (error) {
  // error.message contains user-friendly message
  toast.error(error.message)
}
```

#### 2. Timeout Errors

**Scenario**: Request takes longer than 30 seconds

**Error Message**: "Request timeout. Please check your internet connection and try again."

#### 3. Validation Errors (400)

**Scenario**: Invalid input data

**Error Message**: Backend-provided message or "Invalid request. Please check your input and try again."

#### 4. Not Found (404)

**Scenario**: Evaluation ID doesn't exist

**Error Message**: Backend-provided message or "The requested resource was not found."

#### 5. Server Errors (500)

**Scenario**: Backend internal error

**Error Message**: "Server error occurred. Please try again later."

### Error Handling Best Practices

```typescript
// In components
import { toast } from 'react-hot-toast'

const handleSubmit = async () => {
  setLoading(true)
  try {
    const result = await evaluationApi.submitEvaluation(formData)
    toast.success('Evaluation submitted successfully!')
    navigate(`/results/${result.evaluationId}`)
  } catch (error) {
    // Error is already user-friendly from API client
    toast.error(error instanceof Error ? error.message : 'An error occurred')
    console.error('Submission error:', error)
  } finally {
    setLoading(false)
  }
}
```

## Examples

### Example 1: Fetching Countries for Dropdown

```typescript
import { useEffect, useState } from 'react'
import { visaTypesApi } from '../api/visaTypes'

function CountrySelector() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await visaTypesApi.getCountries()
        setCountries(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <select>
      {countries.map(country => (
        <option key={country.name} value={country.name}>
          {country.name}
        </option>
      ))}
    </select>
  )
}
```

### Example 2: Fetching Visa Types Based on Country

```typescript
import { useVisaTypes } from '../hooks/useVisaTypes'

function VisaTypeSelector({ country }) {
  const { visaTypes, loading, error } = useVisaTypes(country)

  if (!country) return <div>Please select a country first</div>
  if (loading) return <div>Loading visa types...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <select>
      {visaTypes.map(visa => (
        <option key={visa._id} value={visa.visaType}>
          {visa.visaType}
        </option>
      ))}
    </select>
  )
}
```

### Example 3: Submitting Evaluation with Files

```typescript
import { useState } from 'react'
import { evaluationApi } from '../api/evaluations'
import { toast } from 'react-hot-toast'

function EvaluationSubmit() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    visaType: '',
    documents: []
  })
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      documents: Array.from(e.target.files)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await evaluationApi.submitEvaluation(formData)
      
      toast.success('Evaluation submitted successfully!')
      console.log('Evaluation ID:', result.evaluationId)
      console.log('Score:', result.score)
      
      // Navigate to results page
      window.location.href = `/results/${result.evaluationId}`
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Name"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        placeholder="Email"
      />
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Evaluation'}
      </button>
    </form>
  )
}
```

### Example 4: Retrieving Evaluation by ID

```typescript
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { evaluationApi } from '../api/evaluations'

function ResultsPage() {
  const { id } = useParams()
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const data = await evaluationApi.getEvaluationById(id)
        setEvaluation(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEvaluation()
    }
  }, [id])

  if (loading) return <div>Loading evaluation...</div>
  if (error) return <div>Error: {error}</div>
  if (!evaluation) return <div>Evaluation not found</div>

  return (
    <div>
      <h1>Evaluation Results</h1>
      <p>Score: {evaluation.results.score}/100</p>
      <p>Summary: {evaluation.results.summary}</p>
      <p>Country: {evaluation.visaApplication.country}</p>
      <p>Visa Type: {evaluation.visaApplication.visaType}</p>
    </div>
  )
}
```

## Troubleshooting

### Issue: CORS Errors

**Symptoms**: 
- Console shows "CORS policy" errors
- Requests fail with network errors

**Solutions**:
1. Ensure backend has CORS configured to allow frontend origin
2. Backend should include these headers:
   ```
   Access-Control-Allow-Origin: http://localhost:5173
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type
   ```
3. For development, backend can allow all origins: `Access-Control-Allow-Origin: *`

### Issue: 404 Not Found

**Symptoms**: All API requests return 404

**Solutions**:
1. Verify `VITE_API_BASE_URL` is correct in `.env`
2. Ensure backend is running on the correct port
3. Check backend routes are prefixed with `/api`
4. Restart frontend dev server after changing `.env`

### Issue: Request Timeout

**Symptoms**: Requests fail after 30 seconds

**Solutions**:
1. Check backend is responding (test with curl or Postman)
2. Increase timeout in `src/api/client.ts` if needed:
   ```typescript
   const apiClient = axios.create({
     timeout: 60000 // 60 seconds
   })
   ```
3. Check for slow database queries or file processing on backend

### Issue: File Upload Fails

**Symptoms**: 
- Files don't upload
- 400 or 413 errors

**Solutions**:
1. Check file size (must be under 5MB per file)
2. Verify file type is allowed (PDF, DOC, DOCX, JPG, PNG)
3. Ensure backend accepts `multipart/form-data`
4. Check backend file size limits (e.g., Express body-parser limits)

### Issue: Environment Variables Not Loading

**Symptoms**: `import.meta.env.VITE_API_BASE_URL` is undefined

**Solutions**:
1. Ensure variable name starts with `VITE_`
2. Restart dev server after changing `.env`
3. Check `.env` file is in frontend root directory (not in `src/`)
4. Verify no syntax errors in `.env` file (no quotes needed)

### Issue: Cached API Responses

**Symptoms**: Old data displayed after backend changes

**Solutions**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear API cache in code:
   ```typescript
   // In src/api/visaTypes.ts
   // The cache Map can be cleared if needed
   ```

## Testing API Integration

### Using Browser DevTools

1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform actions in the app
4. Check:
   - Request URL is correct
   - Request method (GET, POST)
   - Request payload
   - Response status code
   - Response data

### Using curl

Test backend endpoints directly:

```bash
# Get countries
curl http://localhost:3000/api/visa-types

# Get visa types for a country
curl http://localhost:3000/api/visa-types/United%20States

# Get evaluation by ID
curl http://localhost:3000/api/evaluations/123e4567-e89b-12d3-a456-426614174000

# Submit evaluation (with files)
curl -X POST http://localhost:3000/api/evaluations \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "country=United States" \
  -F "visaType=H-1B Work Visa" \
  -F "documents=@/path/to/file.pdf"
```

### Using Postman

1. Import backend API collection
2. Set base URL to `http://localhost:3000/api`
3. Test each endpoint
4. Verify responses match expected format

## Additional Resources

- [Axios Documentation](https://axios-http.com/docs/intro)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [React Hook Form](https://react-hook-form.com/)
- [Backend API Documentation](../../backend/README.md)
