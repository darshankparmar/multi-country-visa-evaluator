# Scoring Category Configuration Guide

## Overview

The AI evaluation system uses a weighted category-based scoring approach. Each visa application is evaluated across multiple categories, with each category contributing a specific percentage to the final score.

## Configuration File

**Location**: `src/config/scoringCategories.ts`

## Default Configuration

```typescript
export const DEFAULT_SCORING_CONFIG: VisaScoringConfig = {
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

**Total Weight**: 100%

## Category Descriptions

### Professional Qualifications (30%)

**What it evaluates**:
- Educational background and degrees
- Work experience and employment history
- Professional certifications and licenses
- Skills relevant to the visa type
- Career achievements and recognition

**Strong indicators**:
- Advanced degrees from recognized institutions
- Extensive relevant work experience
- Professional certifications in the field
- Awards and recognition
- Publications or patents

**Weak indicators**:
- Incomplete education documentation
- Limited work experience
- Unrelated qualifications
- Missing employment verification

### Financial Stability (20%)

**What it evaluates**:
- Bank statements and account balances
- Employment contracts and salary information
- Proof of income and tax returns
- Sponsorship letters
- Financial guarantees

**Strong indicators**:
- Consistent income over time
- Substantial savings
- Stable employment
- Multiple income sources
- Strong financial backing

**Weak indicators**:
- Insufficient funds
- Irregular income patterns
- No employment verification
- Missing financial documents

### Documentation Quality (25%)

**What it evaluates**:
- Completeness of submitted documents
- Organization and presentation
- Authenticity and verification
- Translations and certifications
- Document clarity and readability

**Strong indicators**:
- All required documents present
- Well-organized submission
- Certified translations
- Official stamps and signatures
- Clear, legible documents

**Weak indicators**:
- Missing required documents
- Poor quality scans
- Uncertified translations
- Questionable authenticity
- Disorganized submission

### Language Proficiency (15%)

**What it evaluates**:
- Language test scores (IELTS, TOEFL, etc.)
- Language certificates
- Evidence of language use
- Educational instruction language
- Work experience in target language

**Strong indicators**:
- High language test scores
- Official language certificates
- Education in target language
- Work experience using language
- Native or near-native proficiency

**Weak indicators**:
- Low test scores
- No language certification
- Limited language exposure
- Unclear language ability

### Country-Specific Requirements (10%)

**What it evaluates**:
- Visa-specific criteria compliance
- Country-specific documentation
- Special requirements for visa type
- Regulatory compliance
- Additional supporting evidence

**Strong indicators**:
- All specific requirements met
- Country-specific documents provided
- Compliance with regulations
- Additional supporting evidence
- Understanding of requirements

**Weak indicators**:
- Missing specific requirements
- Non-compliance with regulations
- Lack of country-specific documents
- Misunderstanding of requirements

## Creating Visa-Specific Configurations

### Step 1: Identify Requirements

Research the specific visa type to understand:
- What factors are most important?
- What documentation is critical?
- What are the key evaluation criteria?

### Step 2: Adjust Weights

Modify category weights to reflect importance:

```typescript
export const VISA_SPECIFIC_CONFIGS: Record<string, VisaScoringConfig> = {
  'United States-O-1A': {
    categories: [
      { 
        name: 'Professional Qualifications', 
        weight: 40,  // Increased - extraordinary ability is key
        description: 'Extraordinary ability evidence' 
      },
      { 
        name: 'Documentation Quality', 
        weight: 30,  // Increased - evidence quality critical
        description: 'Supporting evidence quality' 
      },
      { 
        name: 'Financial Stability', 
        weight: 15,  // Decreased - less critical for O-1A
        description: 'Financial backing' 
      },
      { 
        name: 'Language Proficiency', 
        weight: 10,  // Standard
        description: 'English proficiency' 
      },
      { 
        name: 'Country-Specific Requirements', 
        weight: 5,   // Decreased - covered in other categories
        description: 'O-1A specific criteria' 
      }
    ]
  }
}
```

### Step 3: Validate Configuration

Ensure weights sum to 100%:

```typescript
const totalWeight = config.categories.reduce((sum, cat) => sum + cat.weight, 0)
if (totalWeight !== 100) {
  throw new Error(`Weights must sum to 100, got ${totalWeight}`)
}
```

### Step 4: Test Configuration

Test with sample applications:

```bash
# Use mock mode for testing
USE_MOCK_AI=true npm run dev

# Submit test evaluation
curl -X POST http://localhost:3000/api/evaluations \
  -F "country=United States" \
  -F "visaType=O-1A" \
  -F "name=Test User" \
  -F "email=test@example.com" \
  -F "documents=@test.pdf"
```

## Example Configurations

### Canada Express Entry

```typescript
'Canada-Express Entry': {
  categories: [
    { name: 'Professional Qualifications', weight: 35, description: 'CRS points factors' },
    { name: 'Language Proficiency', weight: 25, description: 'IELTS/CELPIP scores' },
    { name: 'Documentation Quality', weight: 20, description: 'Document completeness' },
    { name: 'Financial Stability', weight: 15, description: 'Proof of funds' },
    { name: 'Country-Specific Requirements', weight: 5, description: 'Express Entry criteria' }
  ]
}
```

**Rationale**: Language proficiency is heavily weighted in Express Entry CRS scoring.

### Germany Blue Card

```typescript
'Germany-Blue Card': {
  categories: [
    { name: 'Professional Qualifications', weight: 35, description: 'University degree and skills' },
    { name: 'Financial Stability', weight: 25, description: 'Salary threshold compliance' },
    { name: 'Documentation Quality', weight: 20, description: 'Document authenticity' },
    { name: 'Language Proficiency', weight: 10, description: 'German language skills' },
    { name: 'Country-Specific Requirements', weight: 10, description: 'Blue Card criteria' }
  ]
}
```

**Rationale**: Financial stability (salary threshold) is critical for Blue Card eligibility.

### UK Skilled Worker

```typescript
'United Kingdom-Skilled Worker': {
  categories: [
    { name: 'Professional Qualifications', weight: 30, description: 'Job offer and skills' },
    { name: 'Documentation Quality', weight: 25, description: 'Certificate of Sponsorship' },
    { name: 'Financial Stability', weight: 20, description: 'Maintenance funds' },
    { name: 'Language Proficiency', weight: 15, description: 'English language requirement' },
    { name: 'Country-Specific Requirements', weight: 10, description: 'Points-based system' }
  ]
}
```

**Rationale**: Balanced approach reflecting UK's points-based system.

## Best Practices

### 1. Research-Based Weights

- Study official visa requirements
- Analyze successful applications
- Consult immigration experts
- Review rejection reasons

### 2. Meaningful Percentages

- Use 5% increments for clarity
- Avoid weights below 5% (too insignificant)
- Avoid weights above 50% (too dominant)
- Ensure balanced distribution

### 3. Clear Descriptions

- Be specific about what's evaluated
- Use terminology from official requirements
- Provide examples when helpful
- Keep descriptions concise

### 4. Consistent Naming

- Use the same category names across configs
- Match official terminology when possible
- Be descriptive but concise
- Avoid abbreviations

### 5. Version Control

- Document changes to configurations
- Track rationale for weight adjustments
- Test before deploying
- Monitor evaluation results

## Validation Rules

### Required Rules

1. **Total Weight = 100%**
   ```typescript
   categories.reduce((sum, cat) => sum + cat.weight, 0) === 100
   ```

2. **All Categories Present**
   ```typescript
   categories.length === 5
   ```

3. **Valid Weight Range**
   ```typescript
   categories.every(cat => cat.weight >= 0 && cat.weight <= 100)
   ```

4. **Non-Empty Descriptions**
   ```typescript
   categories.every(cat => cat.description.length > 0)
   ```

### Recommended Rules

1. **Minimum Weight**: Each category should have at least 5%
2. **Maximum Weight**: No category should exceed 50%
3. **Weight Increments**: Use 5% increments for clarity
4. **Description Length**: Keep descriptions under 100 characters

## Testing Configurations

### Unit Tests

```typescript
describe('Scoring Configuration', () => {
  it('should have weights that sum to 100', () => {
    const config = DEFAULT_SCORING_CONFIG
    const total = config.categories.reduce((sum, cat) => sum + cat.weight, 0)
    expect(total).toBe(100)
  })

  it('should have all required categories', () => {
    const config = DEFAULT_SCORING_CONFIG
    expect(config.categories).toHaveLength(5)
  })

  it('should have valid weight ranges', () => {
    const config = DEFAULT_SCORING_CONFIG
    config.categories.forEach(cat => {
      expect(cat.weight).toBeGreaterThanOrEqual(0)
      expect(cat.weight).toBeLessThanOrEqual(100)
    })
  })
})
```

### Integration Tests

```typescript
describe('Visa-Specific Configurations', () => {
  it('should return correct config for US O-1A', () => {
    const config = getScoringConfig('United States', 'O-1A')
    expect(config.categories[0].weight).toBe(40) // Professional Qualifications
  })

  it('should fallback to default for unknown visa', () => {
    const config = getScoringConfig('Unknown', 'Unknown')
    expect(config).toEqual(DEFAULT_SCORING_CONFIG)
  })
})
```

## Monitoring and Adjustment

### Metrics to Track

1. **Score Distribution**
   - Average scores per visa type
   - Score ranges
   - Outliers

2. **Category Performance**
   - Which categories score highest/lowest
   - Category score variance
   - Correlation with outcomes

3. **Evaluation Quality**
   - User feedback
   - Approval rates
   - Recommendation relevance

### Adjustment Process

1. **Collect Data**: Monitor evaluations over time
2. **Analyze Patterns**: Identify trends and issues
3. **Propose Changes**: Document rationale for adjustments
4. **Test Changes**: Use mock mode to test new weights
5. **Deploy Gradually**: Roll out to subset of users first
6. **Monitor Results**: Track impact of changes
7. **Iterate**: Refine based on results

## Troubleshooting

### Weights Don't Sum to 100

**Error**: `Category weights must sum to 100, got 95`

**Solution**: Adjust weights to total exactly 100%

```typescript
// Before (wrong)
{ name: 'Cat1', weight: 30, ... },
{ name: 'Cat2', weight: 20, ... },
{ name: 'Cat3', weight: 25, ... },
{ name: 'Cat4', weight: 15, ... },
{ name: 'Cat5', weight: 5, ... }  // Total = 95

// After (correct)
{ name: 'Cat1', weight: 30, ... },
{ name: 'Cat2', weight: 20, ... },
{ name: 'Cat3', weight: 25, ... },
{ name: 'Cat4', weight: 15, ... },
{ name: 'Cat5', weight: 10, ... }  // Total = 100
```

### Configuration Not Applied

**Symptom**: Custom config not used for visa type

**Solutions**:
- Check key format: `'Country-VisaType'`
- Verify exact spelling and capitalization
- Restart server after changes
- Check logs for configuration loading

### Unexpected Scores

**Symptom**: Scores don't match expectations

**Solutions**:
- Review category weights
- Check AI category scores in logs
- Verify weighted calculation
- Test with known examples
- Adjust weights based on results

---

**Last Updated**: November 2025  
**Version**: 1.0.0
