# AI Evaluation Enhancement Guide

## Overview

This guide provides comprehensive documentation for the enhanced AI-powered visa evaluation system. The enhancement transforms the evaluation from filename-based assessment to intelligent document content understanding with weighted category scoring.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Weighted Scoring System](#weighted-scoring-system)
5. [Document Parsing](#document-parsing)
6. [API Response Structure](#api-response-structure)
7. [Mock Mode](#mock-mode)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Features

### Core Capabilities

- **Document Content Analysis**: Extracts and analyzes actual text from PDF, DOCX, and TXT files
- **Weighted Category Scoring**: Evaluates applications across 5 configurable categories with custom weights
- **Detailed Recommendations**: Provides 3+ specific, actionable suggestions for improvement
- **Comprehensive Conclusions**: Generates clear statements about application viability
- **Intelligent Fallback**: Gracefully handles parsing failures and API errors
- **Mock Mode**: Cost-free testing with realistic responses
- **Retry Logic**: Automatic retry with exponential backoff for API failures

### What's New

Compared to the basic AI evaluator:

| Feature | Basic AI | Enhanced AI |
|---------|----------|-------------|
| Document Analysis | Filenames only | Full text content |
| Scoring Method | Single score | Weighted categories |
| Recommendations | None | 3+ specific items |
| Conclusion | None | Detailed statement |
| Supported Formats | N/A | PDF, DOCX, TXT |
| Mock Mode | No | Yes |
| Retry Logic | No | Yes (2 attempts) |

## Architecture

### Component Flow

```
User Upload → Document Parser → Text Extraction → OpenAI Analysis → Weighted Scoring → Response
                     ↓                                    ↓
              (PDF/DOCX/TXT)                      (Category Scores)
                     ↓                                    ↓
              Fallback on Error                  Final Weighted Score
```

### Key Components

1. **DocumentParser** (`src/services/documentParser.ts`)
   - Extracts text from multiple document formats
   - Handles parsing errors gracefully
   - Supports parallel document processing

2. **Enhanced AIEvaluator** (`src/services/evaluators/aiEvaluator.ts`)
   - Integrates document parsing
   - Constructs structured prompts
   - Calculates weighted scores
   - Parses AI responses

3. **Scoring Configuration** (`src/config/scoringCategories.ts`)
   - Defines evaluation categories
   - Manages category weights
   - Supports visa-specific configurations

4. **Mock Responses** (`src/services/evaluators/mockAIResponses.ts`)
   - Provides realistic test data
   - Enables cost-free development

## Configuration

### Environment Variables

```bash
# Enable AI evaluation
EVALUATOR_TYPE=ai
OPENAI_API_KEY=sk-your-key-here

# Document parsing configuration
ENABLE_DOCUMENT_PARSING=true        # Enable text extraction
MAX_DOCUMENT_TEXT_LENGTH=10000      # Max characters per document
PARSING_TIMEOUT=30000               # Timeout in milliseconds

# AI model configuration
AI_MODEL=gpt-4                      # OpenAI model to use
AI_TEMPERATURE=0.7                  # Creativity (0-1)
AI_MAX_TOKENS=2000                  # Response length limit
AI_RETRY_ATTEMPTS=2                 # Number of retries

# Testing configuration
USE_MOCK_AI=false                   # Enable mock mode
```

### Configuration Best Practices

**Development Environment**:
```bash
EVALUATOR_TYPE=ai
USE_MOCK_AI=true                    # No API costs
ENABLE_DOCUMENT_PARSING=true
LOG_LEVEL=debug                     # Detailed logging
```

**Production Environment**:
```bash
EVALUATOR_TYPE=ai
USE_MOCK_AI=false
OPENAI_API_KEY=sk-prod-key
ENABLE_DOCUMENT_PARSING=true
AI_MODEL=gpt-4-turbo               # Faster, cheaper
AI_MAX_TOKENS=2000
LOG_LEVEL=info
```

**Testing/CI Environment**:
```bash
EVALUATOR_TYPE=ai
USE_MOCK_AI=true                    # No API calls
ENABLE_DOCUMENT_PARSING=true
LOG_LEVEL=warn
```

## Weighted Scoring System

### How It Works

1. **Category Definition**: Each visa type has 5 evaluation categories
2. **Weight Assignment**: Categories are assigned percentage weights (total = 100%)
3. **AI Assessment**: OpenAI evaluates each category (0-100 score)
4. **Weighted Calculation**: Final score = Σ(category_score × category_weight / 100)
5. **User Response**: Only final score is returned (category breakdown is internal)

### Default Categories

```typescript
{
  categories: [
    {
      name: 'Professional Qualifications',
      weight: 30,
      description: 'Education, work experience, skills relevant to visa type'
    },
    {
      name: 'Financial Stability',
      weight: 20,
      description: 'Employment contracts, bank statements, financial documents'
    },
    {
      name: 'Documentation Quality',
      weight: 25,
      description: 'Completeness, authenticity, and organization of documents'
    },
    {
      name: 'Language Proficiency',
      weight: 15,
      description: 'Language certificates, evidence of language skills'
    },
    {
      name: 'Country-Specific Requirements',
      weight: 10,
      description: 'Visa-specific requirements and compliance'
    }
  ]
}
```

### Creating Custom Configurations

Edit `src/config/scoringCategories.ts`:

```typescript
export const VISA_SPECIFIC_CONFIGS: Record<string, VisaScoringConfig> = {
  'United States-O-1A': {
    categories: [
      { name: 'Professional Qualifications', weight: 40, description: 'Extraordinary ability evidence' },
      { name: 'Documentation Quality', weight: 30, description: 'Supporting evidence quality' },
      { name: 'Financial Stability', weight: 15, description: 'Financial backing' },
      { name: 'Language Proficiency', weight: 10, description: 'English proficiency' },
      { name: 'Country-Specific Requirements', weight: 5, description: 'O-1A specific criteria' }
    ]
  },
  'Canada-Express Entry': {
    categories: [
      { name: 'Professional Qualifications', weight: 35, description: 'CRS points factors' },
      { name: 'Language Proficiency', weight: 25, description: 'IELTS/CELPIP scores' },
      { name: 'Documentation Quality', weight: 20, description: 'Document completeness' },
      { name: 'Financial Stability', weight: 15, description: 'Proof of funds' },
      { name: 'Country-Specific Requirements', weight: 5, description: 'Express Entry criteria' }
    ]
  }
}
```

**Important Rules**:
- Weights must sum to exactly 100
- Use consistent category names
- Provide clear descriptions
- Key format: `'Country-VisaType'`

### Validation

The system validates configurations on startup:

```typescript
// Automatic validation
const totalWeight = config.categories.reduce((sum, cat) => sum + cat.weight, 0)
if (totalWeight !== 100) {
  throw new Error(`Category weights must sum to 100, got ${totalWeight}`)
}
```

## Document Parsing

### Supported Formats

| Format | Library | Features | Limitations |
|--------|---------|----------|-------------|
| PDF | pdf-parse | Text extraction, multi-page | No OCR for scanned PDFs |
| DOCX | mammoth | Text extraction, formatting | Limited style support |
| DOC | mammoth | Text extraction | Older format, less reliable |
| TXT | fs/promises | Direct reading | UTF-8 encoding only |

### Parsing Process

1. **File Detection**: Identifies format by extension
2. **Parallel Processing**: Parses multiple documents concurrently
3. **Text Extraction**: Extracts plain text content
4. **Error Handling**: Continues on failure with error note
5. **Length Limiting**: Truncates very long documents
6. **Formatting**: Prepares text for AI analysis

### Example Parsed Output

```typescript
{
  filename: 'doc_abc123.pdf',
  originalName: 'resume.pdf',
  extractedText: 'John Doe\nSoftware Engineer\n...',
  documentType: 'PDF',
  success: true
}
```

### Handling Parsing Failures

If a document fails to parse:

```typescript
{
  filename: 'doc_xyz789.pdf',
  originalName: 'corrupt.pdf',
  extractedText: '',
  documentType: 'PDF',
  success: false,
  error: 'Invalid PDF structure'
}
```

The system continues evaluation with available documents and notes the failure in the prompt sent to OpenAI.

### Performance Optimization

**Parallel Processing**:
```typescript
// Parse all documents concurrently
const parsedDocuments = await Promise.all(
  documents.map(doc => this.parseDocument(doc.path, doc.filename, doc.originalName))
)
```

**Text Length Limits**:
```typescript
// Prevent token limit issues
if (extractedText.length > MAX_DOCUMENT_TEXT_LENGTH) {
  extractedText = extractedText.substring(0, MAX_DOCUMENT_TEXT_LENGTH) + '\n... [truncated]'
}
```

**Timeout Protection**:
```typescript
// Prevent hanging on large files
const timeout = parseInt(process.env.PARSING_TIMEOUT || '30000')
```

## API Response Structure

### Enhanced Response Format

```json
{
  "success": true,
  "data": {
    "evaluationId": "eval_abc123xyz",
    "score": 78,
    "summary": "Strong application with comprehensive documentation. Candidate demonstrates excellent qualifications for the visa type.",
    "recommendations": [
      "Consider obtaining additional reference letters from industry leaders",
      "Include more recent financial statements to strengthen financial stability",
      "Provide certified translations for any non-English documents"
    ],
    "conclusion": "This application shows strong potential for approval. The candidate meets most requirements and has provided thorough documentation. Addressing the recommendations would further strengthen the application.",
    "evaluatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Field Descriptions

| Field | Type | Description | Always Present |
|-------|------|-------------|----------------|
| `evaluationId` | string | Unique evaluation identifier | Yes |
| `score` | number | Final weighted score (0-100) | Yes |
| `summary` | string | 2-3 sentence overview | Yes |
| `recommendations` | array | Actionable improvement suggestions | Yes (if parsing enabled) |
| `conclusion` | string | Application viability statement | Yes (if parsing enabled) |
| `evaluatedAt` | string | ISO 8601 timestamp | Yes |

### Backward Compatibility

Old evaluations without enhanced fields remain valid:

```json
{
  "success": true,
  "data": {
    "evaluationId": "eval_old123",
    "score": 75,
    "summary": "Good application",
    "evaluatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

### Score Interpretation

| Score Range | Interpretation | Typical Conclusion |
|-------------|----------------|-------------------|
| 85-100 | Excellent | Strong approval likelihood |
| 70-84 | Good | Good approval chances |
| 60-69 | Moderate | Moderate potential with improvements |
| 40-59 | Weak | Low likelihood, significant improvements needed |
| 0-39 | Very Weak | Very low likelihood, major issues |

## Mock Mode

### Enabling Mock Mode

```bash
# In .env
USE_MOCK_AI=true
EVALUATOR_TYPE=ai
```

### Mock Response Structure

Mock mode returns realistic data matching production format:

```typescript
{
  categoryScores: [
    {
      category: 'Professional Qualifications',
      score: 85,
      reasoning: 'Strong educational background with relevant work experience'
    },
    // ... 4 more categories
  ],
  summary: 'Strong application with comprehensive documentation...',
  recommendations: [
    'Consider obtaining additional reference letters from industry leaders',
    'Include more recent financial statements to strengthen financial stability',
    'Provide certified translations for any non-English documents'
  ],
  conclusion: 'This application shows strong potential for approval...'
}
```

### Use Cases

1. **Local Development**
   - No OpenAI API key required
   - Instant responses
   - Zero cost

2. **Automated Testing**
   - Consistent test data
   - No external dependencies
   - Fast test execution

3. **CI/CD Pipelines**
   - No API credentials in CI
   - Reliable test results
   - No rate limiting

4. **Demonstrations**
   - Show system capabilities
   - No API costs
   - Predictable results

5. **Load Testing**
   - Test system performance
   - No API rate limits
   - Measure throughput

### Switching Modes

Mock mode can be toggled without code changes:

```bash
# Development
USE_MOCK_AI=true

# Staging
USE_MOCK_AI=false
OPENAI_API_KEY=sk-staging-key

# Production
USE_MOCK_AI=false
OPENAI_API_KEY=sk-prod-key
```

### Logging

Mock mode is clearly logged:

```
[INFO] AI Evaluator initialized in MOCK mode
[INFO] Using mock AI response for evaluation
```

## Best Practices

### Configuration

1. **Use Environment-Specific Settings**
   - Development: Mock mode enabled
   - Staging: Real API with test keys
   - Production: Real API with production keys

2. **Set Appropriate Timeouts**
   - Small documents: 10-15 seconds
   - Large documents: 30+ seconds
   - Adjust `PARSING_TIMEOUT` based on needs

3. **Monitor Token Usage**
   - Check logs for token consumption
   - Adjust `AI_MAX_TOKENS` if responses are truncated
   - Consider `gpt-4-turbo` for cost savings

### Document Handling

1. **Validate Before Upload**
   - Check file formats on frontend
   - Verify file sizes
   - Ensure documents aren't corrupted

2. **Provide Clear Instructions**
   - Tell users which formats are supported
   - Recommend document quality
   - Suggest optimal file sizes

3. **Handle Failures Gracefully**
   - System continues with available documents
   - Users receive partial evaluation
   - Logs indicate which documents failed

### Scoring Configuration

1. **Validate Weights**
   - Always sum to 100%
   - Use meaningful percentages
   - Document rationale for weights

2. **Test Custom Configurations**
   - Verify with sample evaluations
   - Check score distributions
   - Adjust based on results

3. **Version Control**
   - Track configuration changes
   - Document modifications
   - Test before deploying

### Error Handling

1. **Monitor Logs**
   - Check for parsing failures
   - Watch for API errors
   - Track retry attempts

2. **Set Up Alerts**
   - High failure rates
   - API quota exceeded
   - Parsing timeouts

3. **Implement Fallbacks**
   - System uses rule-based evaluation if AI fails
   - Partial results better than no results
   - Clear error messages to users

## Troubleshooting

### Common Issues

#### 1. Document Parsing Fails

**Symptoms**:
- "Document parsing failed" in logs
- Empty extracted text
- Evaluation based on filenames only

**Solutions**:
- Verify document format is supported
- Check document isn't password-protected
- Ensure document isn't corrupted
- Increase `PARSING_TIMEOUT` for large files
- Check disk space for temporary files

#### 2. OpenAI API Errors

**Symptoms**:
- "OpenAI API call failed" in logs
- Retry attempts logged
- Fallback evaluation used

**Solutions**:
- Verify API key is valid
- Check OpenAI account has credits
- Review rate limits
- Ensure network connectivity
- Check API status at status.openai.com

#### 3. Missing Recommendations/Conclusion

**Symptoms**:
- Response has score and summary only
- No recommendations array
- No conclusion field

**Solutions**:
- Ensure `ENABLE_DOCUMENT_PARSING=true`
- Verify `AI_MAX_TOKENS >= 2000`
- Check OpenAI response in logs
- Verify using GPT-4 model
- Review JSON parsing logs

#### 4. Incorrect Weighted Scores

**Symptoms**:
- Scores don't match expectations
- Category weights seem wrong
- Inconsistent results

**Solutions**:
- Verify category weights sum to 100
- Check visa-specific configuration
- Review category score logs
- Validate scoring configuration
- Test with known examples

#### 5. Mock Mode Not Working

**Symptoms**:
- Real API calls despite `USE_MOCK_AI=true`
- API costs incurred
- Unexpected responses

**Solutions**:
- Verify environment variable is set
- Restart server after changing .env
- Check logs for "MOCK mode" message
- Ensure `EVALUATOR_TYPE=ai`
- Clear any cached configurations

### Debugging Tips

1. **Enable Debug Logging**
   ```bash
   LOG_LEVEL=debug
   ```

2. **Check Specific Logs**
   ```bash
   # Document parsing
   grep "Document parsing" logs/combined.log
   
   # OpenAI calls
   grep "OpenAI API" logs/combined.log
   
   # Category scores
   grep "Category scores calculated" logs/combined.log
   ```

3. **Test Individual Components**
   ```bash
   # Test document parser
   npm test -- documentParser.test.ts
   
   # Test AI evaluator
   npm test -- aiEvaluator.test.ts
   
   # Test scoring config
   npm test -- scoringCategories.test.ts
   ```

4. **Verify Configuration**
   ```bash
   # Check environment variables
   node -e "console.log(require('./dist/config/environment').getConfig())"
   ```

### Getting Help

If issues persist:

1. Check application logs in `logs/` directory
2. Review OpenAI API status
3. Verify all environment variables are set correctly
4. Test with mock mode to isolate issues
5. Check MongoDB connection and data
6. Review recent code changes

---

**Last Updated**: November 2025  
**Version**: 2.0.0
