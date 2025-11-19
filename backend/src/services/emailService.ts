import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../config/logger';
import { getConfig } from '../config/environment';
import { MarkdownGenerator } from './markdownGenerator';
import { IEvaluation } from '../types/evaluation.types';
import { validateEmailAddress } from '../utils/emailValidator';
import { ValidationError } from '../utils/errors';

/**
 * Parameters for sending evaluation result emails
 */
export interface EmailParams {
  email: string;
  name: string;
  score: number;
  summary: string;
  evaluationId: string;
  recommendations?: string[];
  conclusion?: string;
  evaluation?: IEvaluation; // Full evaluation for PDF generation
}

/**
 * Email service for sending evaluation result notifications
 * Uses Nodemailer with SMTP configuration from environment variables
 */
export class EmailService {
  private transporter: Transporter | null = null;
  private enabled: boolean;
  private markdownGenerator: MarkdownGenerator;

  constructor() {
    const config = getConfig();
    this.enabled = config.SMTP_ENABLED;
    this.markdownGenerator = new MarkdownGenerator();

    // Only initialize transporter if SMTP is enabled
    if (this.enabled) {
      this.initializeTransporter();
    } else {
      logger.info('Email service disabled - SMTP_ENABLED is false');
    }
  }

  /**
   * Initialize Nodemailer transporter with SMTP configuration
   * @private
   */
  private initializeTransporter(): void {
    try {
      const config = getConfig();

      if (!config.SMTP_HOST || !config.SMTP_PORT || !config.SMTP_USER || !config.SMTP_PASS) {
        logger.warn('SMTP configuration incomplete - email service will not function');
        this.enabled = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS
        }
      });

      logger.info('Email service initialized successfully', {
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        user: config.SMTP_USER
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      });
      this.enabled = false;
    }
  }

  /**
   * Send evaluation results to user via email with PDF attachment
   * Logs errors but does not throw to prevent blocking the evaluation flow
   * 
   * @param params - Email parameters including recipient, score, and summary
   * @returns Promise<void>
   */
  async sendEvaluationResults(params: EmailParams): Promise<void> {
    // Check if email service is enabled
    if (!this.enabled || !this.transporter) {
      logger.debug('Email sending skipped - service not enabled', { email: params.email });
      return;
    }

    const { email, name, score, summary, evaluationId, recommendations, conclusion, evaluation } = params;

    // Validate email address for injection attempts (defense in depth)
    try {
      validateEmailAddress(email);
    } catch (error) {
      logger.error('Email validation failed - potential injection attempt', {
        email,
        evaluationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new ValidationError('Invalid email address');
    }

    // Sanitize name to prevent any potential injection (defense in depth)
    const sanitizedName = this.sanitizeForEmail(name);

    try {
      const config = getConfig();
      const fromAddress = config.SMTP_FROM || config.SMTP_USER || 'noreply@opensphere.ai';

      const mailOptions: any = {
        from: `Visa Evaluator <${fromAddress}>`,
        to: email,
        subject: 'Your Visa Evaluation Report is Ready',
        html: this.generateEmailTemplate({ name: sanitizedName, score, summary, evaluationId, recommendations, conclusion }),
        text: this.generatePlainTextEmail({ name: sanitizedName, score, summary, evaluationId, recommendations, conclusion })
      };

      // Generate and attach Markdown report if evaluation is provided
      if (evaluation) {
        try {
          const markdownReport = this.markdownGenerator.generateEvaluationReport(evaluation);
          
          // Attach Markdown to email
          mailOptions.attachments = [
            {
              filename: `visa-evaluation-${evaluationId}.md`,
              content: markdownReport,
              contentType: 'text/markdown'
            }
          ];

          logger.info('Markdown report generated and attached to email', {
            evaluationId,
            reportSize: markdownReport.length
          });
        } catch (markdownError) {
          logger.error('Failed to generate Markdown attachment', {
            error: markdownError instanceof Error ? markdownError.message : 'Unknown error',
            evaluationId
          });
          // Continue sending email without Markdown
        }
      }

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Evaluation results email sent successfully', {
        email,
        evaluationId,
        messageId: info.messageId,
        hasMarkdownAttachment: !!evaluation
      });
    } catch (error) {
      // Log error but don't throw - email is optional functionality
      logger.error('Failed to send evaluation results email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        evaluationId
      });
    }
  }

  /**
   * Sanitize string for safe use in email content
   * Removes control characters that could be used for injection
   * 
   * @param value - String to sanitize
   * @returns Sanitized string
   * @private
   */
  private sanitizeForEmail(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    // Remove control characters (CRLF, null bytes, etc.)
    return value
      .replace(/[\r\n\0\t]/g, '')
      .replace(/[<>]/g, '') // Remove angle brackets for additional safety
      .trim();
  }

  /**
   * Generate HTML email template for evaluation results
   * 
   * @param params - Template parameters
   * @returns HTML string
   * @private
   */
  private generateEmailTemplate(_params: Omit<EmailParams, 'email' | 'evaluation'>): string {

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visa Evaluation Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header with Brand -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      Visa Evaluator
                    </h1>
                    <div style="margin-top: 15px; height: 3px; width: 60px; background-color: #ffffff; margin-left: auto; margin-right: auto; border-radius: 2px;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 10px; color: #111827; font-size: 18px; font-weight: 600;">
                Hi,
              </p>
              
              <p style="margin: 0 0 25px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Great news! Your visa evaluation report is ready. We've completed a thorough analysis of your profile and prepared detailed insights on your eligibility.
              </p>
              
              <!-- What's Included Box -->
              <div style="margin: 30px 0; padding: 25px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea;">
                <p style="margin: 0 0 15px; color: #111827; font-size: 16px; font-weight: 600;">
                  Your evaluation includes:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                  <li style="margin-bottom: 8px;">A comprehensive assessment of your eligibility</li>
                  <li style="margin-bottom: 8px;">Personalized recommendations based on your profile</li>
                  <li style="margin-bottom: 0;">Clear next steps to guide your immigration journey</li>
                </ul>
              </div>
              
              <!-- CTA Section -->
              <p style="margin: 25px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                If you have any questions or need assistance understanding your evaluation, please don't hesitate to reach out. We're here to support you throughout this process.
              </p>
              
              <!-- Disclaimer Box -->
              <div style="margin: 30px 0 0; padding: 20px; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fbbf24;">
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                  <strong>Note:</strong> We are a technology company that provides visa application assistance. We are not a law firm and do not provide legal advice. For legal counsel, please consult with a licensed immigration attorney.
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; text-align: center;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                If you have any questions or need assistance, please don't hesitate to contact us.
              </p>
              <p style="margin: 15px 0 0; color: #111827; font-size: 15px; font-weight: 600;">
                Thank you,
              </p>
              <p style="margin: 5px 0 20px; color: #667eea; font-size: 16px; font-weight: 700;">
                Visa Evaluator
              </p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  © 2025 Visa Evaluator. All rights reserved.
                </p>
                <p style="margin: 5px 0 0; color: #9ca3af; font-size: 11px;">
                  Powered by <span style="color: #667eea;">multi-country-visa-evaluator.vercel.app</span>
                </p>
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text email for evaluation results (fallback)
   * 
   * @param params - Template parameters
   * @returns Plain text string
   * @private
   */
  private generatePlainTextEmail(params: Omit<EmailParams, 'email'>): string {
    const { name, score, summary, evaluationId, recommendations, conclusion } = params;

    // Build recommendations section if available
    const recommendationsText = recommendations && recommendations.length > 0
      ? `\n\nRECOMMENDATIONS:\n${recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}`
      : '';

    // Build conclusion section if available
    const conclusionText = conclusion
      ? `\n\nCONCLUSION:\n${conclusion}`
      : '';

    return `
Hello ${name},

Your visa evaluation has been completed. Here are your results:

EVALUATION SCORE: ${score}/100

EVALUATION SUMMARY:
${summary}${recommendationsText}${conclusionText}

Evaluation ID: ${evaluationId}

Please keep this evaluation ID for your records. If you have any questions about your results, please contact us with this reference number.

---
This is an automated message. Please do not reply to this email.
    `.trim();
  }
}
