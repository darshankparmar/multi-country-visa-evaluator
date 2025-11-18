# Partner API Key Generation Guide

This guide explains how to generate and manage Partner API keys for the Multi-Country Visa Evaluation system.

## Overview

Partner API keys allow immigration law firms and other partners to:
- Submit visa evaluations on behalf of their clients
- Retrieve all evaluations associated with their account
- Track and manage client applications

## Generating a New Partner API Key

### Step 1: Create a Partner Account

Use the admin endpoint to create a new partner account. The API key will be automatically generated.

**Endpoint**: `POST /api/partners`

**Request**:
```bash
curl -X POST http://localhost:3000/api/partners \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Law Firm Name",
    "email": "contact@yourlawfirm.com",
    "contactInfo": {
      "phone": "+1-555-0123",
      "website": "https://yourlawfirm.com"
    }
  }'
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "partnerId": "673a1234567890abcdef5678",
    "name": "Your Law Firm Name",
    "email": "contact@yourlawfirm.com",
    "apiKey": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "contactInfo": {
      "phone": "+1-555-0123",
      "website": "https://yourlawfirm.com"
    },
    "active": true,
    "createdAt": "2025-11-18T10:30:00.000Z"
  }
}
```

### Step 2: Save Your API Key

**Important**: The API key is only shown once during creation. Save it securely:

```
apiKey: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

- Store it in a secure password manager or secrets vault
- Never commit it to version control
- Never share it publicly

### Step 3: Test Your API Key

Verify your API key works by making a test request:

```bash
curl -H "x-api-key: your-api-key-here" \
     http://localhost:3000/api/evaluations
```

## Using Your API Key

Include your API key in the `x-api-key` header for all partner-specific requests:

```bash
# Submit an evaluation
curl -X POST http://localhost:3000/api/evaluations \
  -H "x-api-key: your-api-key-here" \
  -F "name=Client Name" \
  -F "email=client@example.com" \
  -F "country=United States" \
  -F "visaType=O-1A"

# Retrieve your evaluations
curl -H "x-api-key: your-api-key-here" \
     http://localhost:3000/api/evaluations?page=1&limit=20
```

## Managing Partner Accounts

### List All Partners

```bash
curl http://localhost:3000/api/partners
```

### Deactivate a Partner

```bash
curl -X PATCH http://localhost:3000/api/partners/{partnerId}/deactivate
```

### Reactivate a Partner

```bash
curl -X PATCH http://localhost:3000/api/partners/{partnerId}/activate
```

## Security Best Practices

1. **Keep API Keys Secret**: Never expose your API key in client-side code or public repositories
2. **Use Environment Variables**: Store API keys in environment variables, not in code
3. **Rotate Keys Regularly**: Contact the administrator to generate new keys periodically
4. **Monitor Usage**: Regularly check your evaluation logs for suspicious activity
5. **Deactivate Compromised Keys**: If a key is compromised, contact the administrator immediately to deactivate it

## Rate Limits

Partner API keys are subject to the following rate limits:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General API Requests | 1000 requests | per hour per API key |
| Evaluation Submissions | 50 submissions | per hour per API key |

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

## Troubleshooting

### 401 Unauthorized Error

**Cause**: Invalid or missing API key

**Solution**:
- Verify the API key is correct
- Check that the `x-api-key` header is included
- Ensure the partner account is active

### 429 Too Many Requests

**Cause**: Rate limit exceeded

**Solution**:
- Wait for the rate limit window to reset (check `X-RateLimit-Reset` header)
- Implement exponential backoff in your integration
- Contact the administrator if you need higher limits

### Empty Evaluation List

**Cause**: No evaluations associated with your API key

**Solution**:
- Ensure you're including the `x-api-key` header when submitting evaluations
- Only evaluations submitted with your API key will appear in your list

## Support

For assistance with Partner API keys:
- **Email**: darshanparmar.dev@gmail.com
- **Documentation**: See [API.md](./API.md) for complete API reference
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details

## Related Documentation

- [API Reference](./API.md) - Complete API endpoint documentation
- [Requirements](./REQUIREMENTS.md) - System requirements including Requirement 10
- [Architecture](./ARCHITECTURE.md) - Technical implementation details
