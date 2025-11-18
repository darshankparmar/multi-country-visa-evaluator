/**
 * Tests for EnhancedPromptBuilder
 */

import { EnhancedPromptBuilder } from '../services/enhancedPromptBuilder'
import { getVisaCriteria } from '../config/visaCriteria'
import { ParsedDocument } from '../services/documentParser'

describe('EnhancedPromptBuilder', () => {
  let promptBuilder: EnhancedPromptBuilder

  beforeEach(() => {
    promptBuilder = new EnhancedPromptBuilder()
  })

  describe('buildVisaSpecificPrompt', () => {
    it('should build a complete prompt for Ireland Critical Skills visa', () => {
      const criteria = getVisaCriteria('Ireland', 'Critical Skills Employment Permit')
      expect(criteria).not.toBeNull()

      const parsedDocuments: ParsedDocument[] = [
        {
          filename: 'resume.pdf',
          originalName: 'resume.pdf',
          extractedText: 'John Doe\nSoftware Engineer\n5 years experience\nBachelor of Science in Computer Science\nSalary: €45,000 per year',
          documentType: 'PDF',
          success: true
        }
      ]

      const userInfo = {
        name: 'John Doe',
        email: 'john.doe@example.com'
      }

      const prompt = promptBuilder.buildVisaSpecificPrompt(
        'Ireland',
        'Critical Skills Employment Permit',
        criteria!,
        parsedDocuments,
        userInfo
      )

      // Verify prompt contains key sections
      expect(prompt).toContain('Visa Evaluation Request')
      expect(prompt).toContain('John Doe')
      expect(prompt).toContain('Ireland')
      expect(prompt).toContain('Critical Skills Employment Permit')
      expect(prompt).toContain('Mandatory Requirements Checklist')
      expect(prompt).toContain('Detailed Visa Criteria')
      expect(prompt).toContain('Applicant Documents')
      expect(prompt).toContain('Evaluation Instructions')
      
      // Verify salary thresholds are included
      expect(prompt).toContain('38,000')
      expect(prompt).toContain('64,000')
      
      // Verify education requirement is included
      expect(prompt).toContain('Bachelor')
      
      // Verify document content is included
      expect(prompt).toContain('Software Engineer')
      expect(prompt).toContain('5 years experience')
    })

    it('should build a prompt for Netherlands Knowledge Migrant with multiple salary thresholds', () => {
      const criteria = getVisaCriteria('Netherlands', 'Knowledge Migrant Permit')
      expect(criteria).not.toBeNull()

      const parsedDocuments: ParsedDocument[] = [
        {
          filename: 'contract.pdf',
          originalName: 'contract.pdf',
          extractedText: 'Employment Contract\nSalary: €5,800 per month\nPosition: Senior Developer',
          documentType: 'PDF',
          success: true
        }
      ]

      const userInfo = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com'
      }

      const prompt = promptBuilder.buildVisaSpecificPrompt(
        'Netherlands',
        'Knowledge Migrant Permit',
        criteria!,
        parsedDocuments,
        userInfo
      )

      // Verify multiple salary thresholds are mentioned
      expect(prompt).toContain('5,688')
      expect(prompt).toContain('4,171')
      expect(prompt).toContain('if 30 years or older')
      expect(prompt).toContain('if under 30 years old')
      
      // Verify sponsor requirement is mentioned
      expect(prompt).toContain('Recognized sponsor')
    })

    it('should handle failed document parsing', () => {
      const criteria = getVisaCriteria('Germany', 'EU Blue Card')
      expect(criteria).not.toBeNull()

      const parsedDocuments: ParsedDocument[] = [
        {
          filename: 'resume.pdf',
          originalName: 'resume.pdf',
          extractedText: 'Valid resume content',
          documentType: 'PDF',
          success: true
        },
        {
          filename: 'diploma.pdf',
          originalName: 'diploma.pdf',
          extractedText: '',
          documentType: 'PDF',
          success: false,
          error: 'Failed to parse PDF'
        }
      ]

      const userInfo = {
        name: 'Test User',
        email: 'test@example.com'
      }

      const prompt = promptBuilder.buildVisaSpecificPrompt(
        'Germany',
        'EU Blue Card',
        criteria!,
        parsedDocuments,
        userInfo
      )

      // Verify successful document is included
      expect(prompt).toContain('Valid resume content')
      
      // Verify failed document is mentioned
      expect(prompt).toContain('Failed to Parse')
      expect(prompt).toContain('diploma.pdf')
      expect(prompt).toContain('Failed to parse PDF')
    })

    it('should include labor market test information when required', () => {
      const criteria = getVisaCriteria('Ireland', 'General Employment Permit')
      expect(criteria).not.toBeNull()

      const parsedDocuments: ParsedDocument[] = []
      const userInfo = { name: 'Test', email: 'test@example.com' }

      const prompt = promptBuilder.buildVisaSpecificPrompt(
        'Ireland',
        'General Employment Permit',
        criteria!,
        parsedDocuments,
        userInfo
      )

      // Verify labor market test is mentioned
      expect(prompt).toContain('Labor Market Test')
      expect(prompt).toContain('**Required:** Yes')
    })

    it('should include unique rules and benefits', () => {
      const criteria = getVisaCriteria('Germany', 'EU Blue Card')
      expect(criteria).not.toBeNull()

      const parsedDocuments: ParsedDocument[] = []
      const userInfo = { name: 'Test', email: 'test@example.com' }

      const prompt = promptBuilder.buildVisaSpecificPrompt(
        'Germany',
        'EU Blue Card',
        criteria!,
        parsedDocuments,
        userInfo
      )

      // Verify unique rules are included
      expect(prompt).toContain('Special Rules and Benefits')
      expect(prompt).toContain('Fast-track to permanent residency')
      expect(prompt).toContain('Family reunification')
    })
  })
})
