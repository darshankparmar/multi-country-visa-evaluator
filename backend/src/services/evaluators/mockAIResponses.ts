/**
 * Mock AI Response Definitions
 * 
 * Provides predefined evaluation responses for testing and development
 * without incurring OpenAI API costs. Mock responses match the production
 * response structure to ensure compatibility.
 */

/**
 * Mock evaluation response with sample category scores and recommendations
 * 
 * This response represents a strong visa application with comprehensive
 * documentation and good qualifications across all categories.
 */
export const MOCK_EVALUATION_RESPONSE = {
  categoryScores: [
    {
      category: 'Professional Qualifications',
      score: 85,
      reasoning: 'Strong educational background with relevant work experience. Demonstrates expertise in the field with multiple years of professional practice.'
    },
    {
      category: 'Financial Stability',
      score: 75,
      reasoning: 'Adequate financial documentation provided. Bank statements show sufficient funds, though additional proof of ongoing income would strengthen the application.'
    },
    {
      category: 'Documentation Quality',
      score: 90,
      reasoning: 'All documents are well-organized, complete, and properly formatted. Clear evidence of authenticity and attention to detail.'
    },
    {
      category: 'Language Proficiency',
      score: 80,
      reasoning: 'Good language skills demonstrated through certificates and professional experience. Meets the required proficiency level for the visa type.'
    },
    {
      category: 'Country-Specific Requirements',
      score: 70,
      reasoning: 'Meets most country-specific requirements with minor gaps. Some additional documentation may be beneficial for strengthening compliance.'
    }
  ],
  summary: 'Strong application with comprehensive documentation. The candidate demonstrates excellent qualifications and has provided thorough supporting materials. Overall assessment indicates good potential for visa approval.',
  recommendations: [
    'Consider obtaining additional reference letters from industry leaders or professional associations to further strengthen professional qualifications',
    'Include more recent financial statements (within last 3 months) to demonstrate current financial stability',
    'Provide certified translations for any non-English documents to ensure complete compliance with documentation requirements'
  ],
  conclusion: 'This application shows strong potential for approval. The candidate meets most requirements and has provided thorough documentation. Addressing the recommendations above would further strengthen the application and increase approval likelihood.'
}

/**
 * Alternative mock response for weaker applications
 * Used for testing different evaluation scenarios
 */
export const MOCK_WEAK_EVALUATION_RESPONSE = {
  categoryScores: [
    {
      category: 'Professional Qualifications',
      score: 55,
      reasoning: 'Basic qualifications present but lacking depth. Limited work experience in the relevant field.'
    },
    {
      category: 'Financial Stability',
      score: 45,
      reasoning: 'Financial documentation is incomplete. Bank statements show insufficient funds for the visa requirements.'
    },
    {
      category: 'Documentation Quality',
      score: 60,
      reasoning: 'Some documents are missing or incomplete. Organization could be improved for better clarity.'
    },
    {
      category: 'Language Proficiency',
      score: 50,
      reasoning: 'Minimal evidence of language proficiency. Additional language certificates would be beneficial.'
    },
    {
      category: 'Country-Specific Requirements',
      score: 40,
      reasoning: 'Several country-specific requirements are not adequately addressed. Significant gaps in compliance.'
    }
  ],
  summary: 'Application requires significant improvements before submission. Multiple areas need strengthening, particularly financial documentation and country-specific requirements. Current assessment indicates low approval likelihood without substantial enhancements.',
  recommendations: [
    'Obtain comprehensive financial documentation including bank statements for the past 6 months showing sufficient funds',
    'Acquire additional professional certifications or reference letters to strengthen qualifications',
    'Complete all missing documents and ensure full compliance with country-specific visa requirements',
    'Consider obtaining language proficiency certificates from recognized testing organizations'
  ],
  conclusion: 'This application needs substantial improvements before it can be considered strong. Focus on addressing the financial stability concerns and completing all required documentation. Consider consulting with an immigration specialist to ensure all requirements are properly met.'
}

/**
 * Mock response for O-1A visa (extraordinary ability)
 * Demonstrates visa-specific evaluation
 */
export const MOCK_O1A_EVALUATION_RESPONSE = {
  categoryScores: [
    {
      category: 'Professional Qualifications',
      score: 92,
      reasoning: 'Exceptional evidence of extraordinary ability. Multiple awards, publications, and recognition from industry leaders demonstrate sustained national or international acclaim.'
    },
    {
      category: 'Documentation Quality',
      score: 88,
      reasoning: 'Comprehensive supporting evidence with detailed documentation of achievements. Well-organized portfolio of work samples and testimonials.'
    },
    {
      category: 'Financial Stability',
      score: 80,
      reasoning: 'Strong financial backing with employment contract and sponsor support. Clear evidence of ability to sustain during visa period.'
    },
    {
      category: 'Language Proficiency',
      score: 85,
      reasoning: 'Excellent English proficiency demonstrated through professional work and academic credentials. No concerns for professional communication.'
    },
    {
      category: 'Country-Specific Requirements',
      score: 78,
      reasoning: 'Meets O-1A specific criteria with strong evidence in multiple categories. Minor additional documentation could further strengthen the case.'
    }
  ],
  summary: 'Exceptional O-1A application demonstrating extraordinary ability in the field. Strong evidence of sustained acclaim and recognition. The candidate has provided comprehensive documentation supporting their extraordinary ability claim.',
  recommendations: [
    'Include additional letters from recognized experts in the field to further validate extraordinary ability claims',
    'Provide detailed itinerary of planned activities in the United States to strengthen the purpose of visit',
    'Consider adding more recent press coverage or media recognition to demonstrate continued prominence in the field'
  ],
  conclusion: 'This O-1A application is very strong and demonstrates clear evidence of extraordinary ability. The candidate has excellent approval prospects. The comprehensive documentation and strong professional achievements make this a compelling case for visa approval.'
}

/**
 * Retrieves appropriate mock response based on visa type and country
 * 
 * @param country - Target country for visa application
 * @param visaType - Specific visa type being applied for
 * @returns Mock evaluation response matching the visa type
 */
export function getMockResponse(country: string, visaType: string): typeof MOCK_EVALUATION_RESPONSE {
  // Return visa-specific mock responses
  if (country === 'United States' && visaType === 'O-1A') {
    return MOCK_O1A_EVALUATION_RESPONSE
  }
  
  // For testing weak applications (can be triggered by specific test patterns)
  // This is useful for testing different evaluation scenarios
  if (visaType.toLowerCase().includes('test-weak')) {
    return MOCK_WEAK_EVALUATION_RESPONSE
  }
  
  // Default to strong evaluation response
  return MOCK_EVALUATION_RESPONSE
}

/**
 * Generates a randomized mock response for more realistic testing
 * Adds slight variations to scores to simulate different applications
 * 
 * @param country - Target country for visa application
 * @param visaType - Specific visa type being applied for
 * @returns Mock evaluation response with randomized scores
 */
export function getRandomizedMockResponse(country: string, visaType: string): typeof MOCK_EVALUATION_RESPONSE {
  const baseResponse = getMockResponse(country, visaType)
  
  // Add random variation of ±5 points to each category score
  const randomizedResponse = {
    ...baseResponse,
    categoryScores: baseResponse.categoryScores.map(category => ({
      ...category,
      score: Math.max(0, Math.min(100, category.score + (Math.random() * 10 - 5)))
    }))
  }
  
  return randomizedResponse
}
