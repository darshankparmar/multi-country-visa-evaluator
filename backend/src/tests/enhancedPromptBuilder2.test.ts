import { EnhancedPromptBuilder } from '../services/enhancedPromptBuilder';
import { VisaCriteriaConfig } from '../config/visaCriteria';
import { ParsedDocument } from '../services/documentParser';

describe('EnhancedPromptBuilder', () => {
  let builder: EnhancedPromptBuilder;

  beforeEach(() => {
    builder = new EnhancedPromptBuilder();
  });

  describe('buildVisaSpecificPrompt', () => {
    const mockVisaCriteria: VisaCriteriaConfig = {
      country: 'Ireland',
      visaType: 'Critical Skills Employment Permit',
      description: 'For highly skilled workers in shortage occupations',
      salaryThresholds: [
        { amount: 38000, currency: 'EUR', period: 'annual', conditions: 'for critical occupations' }
      ],
      educationLevel: 'Bachelor',
      alternativeQualification: 'Equivalent experience',
      experienceYears: 0,
      laborMarketTestRequired: false,
      sponsorRequired: true,
      sponsorType: 'Registered Irish employer',
      processingTime: '8-12 weeks',
      pathToPermanentResidency: 'After 2 years',
      uniqueRules: ['No Labour Market Test required', 'Spouses can work'],
      criteriaWeights: {
        salary: 35,
        education: 25,
        experience: 15,
        documentation: 15,
        other: 10
      }
    };

    const mockParsedDocuments: ParsedDocument[] = [
      {
        filename: 'resume.pdf',
        originalName: 'John Doe Resume.pdf',
        extractedText: 'Software Engineer with 5 years experience. Bachelor of Science in Computer Science.',
        documentType: 'PDF',
        success: true
      }
    ];

    const mockUserInfo = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    it('should build a complete visa-specific prompt', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should include applicant information', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('John Doe');
      expect(prompt).toContain('john@example.com');
      expect(prompt).toContain('Ireland');
      expect(prompt).toContain('Critical Skills Employment Permit');
    });

    it('should include visa description', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('For highly skilled workers in shortage occupations');
    });

    it('should include processing time when available', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('8-12 weeks');
    });

    it('should include path to permanent residency when available', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('After 2 years');
    });

    it('should include mandatory requirements checklist', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Mandatory Requirements Checklist');
      expect(prompt).toContain('- [ ]');
    });

    it('should include salary requirements in checklist', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Salary');
      expect(prompt).toContain('EUR 38,000');
    });

    it('should include education requirements in checklist', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Education');
      expect(prompt).toContain('Bachelor');
    });

    it('should include detailed criteria section', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Detailed Visa Criteria');
      expect(prompt).toContain('Salary Requirements');
      expect(prompt).toContain('Education Requirements');
    });

    it('should include labor market test information', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Labor Market Test');
      expect(prompt).toContain('No');
    });

    it('should include sponsor requirements', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Sponsor Requirements');
      expect(prompt).toContain('Registered Irish employer');
    });

    it('should include unique rules', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Special Rules and Benefits');
      expect(prompt).toContain('No Labour Market Test required');
      expect(prompt).toContain('Spouses can work');
    });

    it('should include criteria weights', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Evaluation Weights');
      expect(prompt).toContain('Salary: 35%');
      expect(prompt).toContain('Education: 25%');
    });

    it('should include document content', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Applicant Documents');
      expect(prompt).toContain('John Doe Resume.pdf');
      expect(prompt).toContain('Software Engineer with 5 years experience');
    });

    it('should include evaluation instructions', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Evaluation Instructions');
      expect(prompt).toContain('Verifies each mandatory requirement');
    });

    it('should include JSON response format', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Response Format');
      expect(prompt).toContain('valid JSON object');
      expect(prompt).toContain('"score"');
      expect(prompt).toContain('"summary"');
      expect(prompt).toContain('"recommendations"');
      expect(prompt).toContain('"conclusion"');
    });

    it('should handle multiple documents', () => {
      const multipleDocuments: ParsedDocument[] = [
        {
          filename: 'resume.pdf',
          originalName: 'Resume.pdf',
          extractedText: 'Resume content',
          documentType: 'PDF',
          success: true
        },
        {
          filename: 'diploma.pdf',
          originalName: 'Diploma.pdf',
          extractedText: 'Diploma content',
          documentType: 'PDF',
          success: true
        }
      ];

      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        multipleDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Resume.pdf');
      expect(prompt).toContain('Diploma.pdf');
      expect(prompt).toContain('Resume content');
      expect(prompt).toContain('Diploma content');
    });

    it('should handle failed document parsing', () => {
      const documentsWithFailure: ParsedDocument[] = [
        {
          filename: 'resume.pdf',
          originalName: 'Resume.pdf',
          extractedText: 'Resume content',
          documentType: 'PDF',
          success: true
        },
        {
          filename: 'corrupt.pdf',
          originalName: 'Corrupt.pdf',
          extractedText: '',
          documentType: 'PDF',
          success: false,
          error: 'File is corrupted'
        }
      ];

      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        documentsWithFailure,
        mockUserInfo
      );

      expect(prompt).toContain('Failed to Parse');
      expect(prompt).toContain('Corrupt.pdf');
      expect(prompt).toContain('File is corrupted');
    });

    it('should handle visa without salary thresholds', () => {
      const criteriaWithoutSalary: VisaCriteriaConfig = {
        ...mockVisaCriteria,
        salaryThresholds: undefined
      };

      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Test Visa',
        criteriaWithoutSalary,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should handle visa without education requirement', () => {
      const criteriaWithoutEducation: VisaCriteriaConfig = {
        ...mockVisaCriteria,
        educationLevel: undefined
      };

      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Test Visa',
        criteriaWithoutEducation,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should handle multiple salary thresholds', () => {
      const criteriaWithMultipleThresholds: VisaCriteriaConfig = {
        ...mockVisaCriteria,
        salaryThresholds: [
          { amount: 38000, currency: 'EUR', period: 'annual', conditions: 'for critical occupations' },
          { amount: 64000, currency: 'EUR', period: 'annual', conditions: 'for other occupations' }
        ]
      };

      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Test Visa',
        criteriaWithMultipleThresholds,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('38,000');
      expect(prompt).toContain('64,000');
      expect(prompt).toContain('critical occupations');
      expect(prompt).toContain('other occupations');
    });

    it('should format monthly salary thresholds correctly', () => {
      const criteriaWithMonthlySalary: VisaCriteriaConfig = {
        ...mockVisaCriteria,
        salaryThresholds: [
          { amount: 5688, currency: 'EUR', period: 'monthly', conditions: 'if 30 years or older' }
        ]
      };

      const prompt = builder.buildVisaSpecificPrompt(
        'Netherlands',
        'Knowledge Migrant Permit',
        criteriaWithMonthlySalary,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('5,688');
      expect(prompt).toContain('monthly');
    });

    it('should include alternative qualification when present', () => {
      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        mockVisaCriteria,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Alternative Qualification');
      expect(prompt).toContain('Equivalent experience');
    });

    it('should handle visa with experience requirement', () => {
      const criteriaWithExperience: VisaCriteriaConfig = {
        ...mockVisaCriteria,
        experienceYears: 3
      };

      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Test Visa',
        criteriaWithExperience,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Experience Requirements');
      expect(prompt).toContain('3 year');
    });

    it('should handle visa requiring labor market test', () => {
      const criteriaWithLaborTest: VisaCriteriaConfig = {
        ...mockVisaCriteria,
        laborMarketTestRequired: true
      };

      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Test Visa',
        criteriaWithLaborTest,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Labor Market Test');
      expect(prompt).toContain('Yes');
    });

    it('should handle visa without sponsor requirement', () => {
      const criteriaWithoutSponsor: VisaCriteriaConfig = {
        ...mockVisaCriteria,
        sponsorRequired: false
      };

      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Test Visa',
        criteriaWithoutSponsor,
        mockParsedDocuments,
        mockUserInfo
      );

      expect(prompt).toContain('Applicant can apply independently');
    });
  });

  describe('Prompt Quality', () => {
    it('should generate prompts with consistent structure', () => {
      const criteria: VisaCriteriaConfig = {
        country: 'Test',
        visaType: 'Test Visa',
        description: 'Test description',
        laborMarketTestRequired: false,
        sponsorRequired: false
      };

      const documents: ParsedDocument[] = [
        {
          filename: 'test.pdf',
          originalName: 'Test.pdf',
          extractedText: 'Test content',
          documentType: 'PDF',
          success: true
        }
      ];

      const prompt = builder.buildVisaSpecificPrompt(
        'Test',
        'Test Visa',
        criteria,
        documents,
        { name: 'Test', email: 'test@test.com' }
      );

      expect(prompt).toContain('# Visa Evaluation Request');
      expect(prompt).toContain('## Visa Type Information');
      expect(prompt).toContain('## Mandatory Requirements Checklist');
      expect(prompt).toContain('## Detailed Visa Criteria');
      expect(prompt).toContain('## Applicant Documents');
      expect(prompt).toContain('## Evaluation Instructions');
      expect(prompt).toContain('## Response Format');
    });

    it('should generate prompts with sufficient detail', () => {
      const criteria: VisaCriteriaConfig = {
        country: 'Ireland',
        visaType: 'Critical Skills Employment Permit',
        description: 'For highly skilled workers',
        salaryThresholds: [
          { amount: 38000, currency: 'EUR', period: 'annual' }
        ],
        educationLevel: 'Bachelor',
        experienceYears: 2,
        laborMarketTestRequired: false,
        sponsorRequired: true,
        uniqueRules: ['Rule 1', 'Rule 2']
      };

      const documents: ParsedDocument[] = [
        {
          filename: 'test.pdf',
          originalName: 'Test.pdf',
          extractedText: 'Test content',
          documentType: 'PDF',
          success: true
        }
      ];

      const prompt = builder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        criteria,
        documents,
        { name: 'Test', email: 'test@test.com' }
      );

      expect(prompt.length).toBeGreaterThan(1000);
    });
  });
});
