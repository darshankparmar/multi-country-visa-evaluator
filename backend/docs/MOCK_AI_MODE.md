# Mock AI Mode for Testing

## Overview

The Mock AI Mode allows you to test the AI evaluation system without making actual OpenAI API calls, eliminating API costs during development and testing.

## Configuration

### Enable Mock Mode

Set the `USE_MOCK_AI` environment variable to `true` in your `.env` file:

```bash
USE_MOCK_AI=true
```

### Disable Mock Mode (Production)

Set the `USE_MOCK_AI` environment variable to `false`:

```bash
USE_MOCK_AI=false
```

## How It Works

When mock mode is enabled:

1. The AIEvaluator initializes without creating an OpenAI client
2. All evaluation requests return predefined mock responses
3. No API calls are made to OpenAI
4. No API costs are incurred
5. Responses match the exact structure of real OpenAI responses

## Mock Response Types

### Default Mock Response
- Strong application with good scores across all categories
- Comprehensive recommendations
- Positive conclusion
- Used for most visa types

### O-1A Visa Mock Response
- Exceptional scores reflecting extraordinary ability requirements
- Specific recommendations for O-1A applications
- Automatically used when evaluating `United States - O-1A` visas

### Weak Application Mock Response
- Lower scores across categories
- More critical recommendations
- Used for testing weak application scenarios
- Triggered by visa types containing "test-weak" in the name

## Example Usage

### Testing with Mock Mode

```typescript
// Set environment variable
process.env.USE_MOCK_AI = 'true';

// Create evaluator (will use mock mode)
const evaluator = new AIEvaluator();

// Evaluate application (returns mock response)
const result = await evaluator.evaluate({
  country: 'United States',
  visaType: 'O-1A',
  documents: [...],
  userInfo: { name: 'Test User', email: 'test@example.com' }
});

// Result contains mock data with proper structure
console.log(result.score); // e.g., 85
console.log(result.recommendations); // Array of recommendations
console.log(result.conclusion); // Conclusion statement
```

### Testing Different Scenarios

```typescript
// Test strong application (default)
const strongResult = await evaluator.evaluate({
  country: 'Canada',
  visaType: 'Work Permit',
  // ...
});

// Test O-1A specific response
const o1aResult = await evaluator.evaluate({
  country: 'United States',
  visaType: 'O-1A',
  // ...
});

// Test weak application
const weakResult = await evaluator.evaluate({
  country: 'United Kingdom',
  visaType: 'test-weak',
  // ...
});
```

## Logging

Mock mode logs clearly indicate when mock responses are being used:

```
[INFO] AI Evaluator initialized in MOCK mode - no OpenAI API calls will be made
[INFO] Using mock AI response for evaluation { country: 'United States', visaType: 'O-1A', documentCount: 3, mockMode: true }
[INFO] Mock evaluation - Category scores calculated { categories: [...], finalScore: 85, mockMode: true }
```

## Benefits

1. **Cost Savings**: No OpenAI API charges during development
2. **Faster Testing**: Instant responses without network latency
3. **Predictable Results**: Consistent mock data for testing
4. **Offline Development**: Work without internet connection
5. **CI/CD Integration**: Run tests without API keys

## Switching Between Modes

You can easily switch between mock and real modes by changing the environment variable:

```bash
# Development/Testing
USE_MOCK_AI=true

# Production
USE_MOCK_AI=false
```

No code changes are required - the AIEvaluator automatically detects the mode on initialization.

## Important Notes

- Mock responses use the same weighted scoring calculation as real evaluations
- Category scores are calculated internally but not exposed to users (same as real mode)
- Mock mode is automatically detected on AIEvaluator initialization
- The OpenAI client is not created when mock mode is enabled
- All response structures match production responses exactly

## Customizing Mock Responses

To add custom mock responses, edit `backend/src/services/evaluators/mockAIResponses.ts`:

```typescript
// Add new visa-specific mock response
export const MOCK_CUSTOM_VISA_RESPONSE = {
  categoryScores: [...],
  summary: '...',
  recommendations: [...],
  conclusion: '...'
};

// Update getMockResponse function
export function getMockResponse(country: string, visaType: string) {
  if (country === 'YourCountry' && visaType === 'YourVisaType') {
    return MOCK_CUSTOM_VISA_RESPONSE;
  }
  // ...
}
```
