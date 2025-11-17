import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../config/logger';
import { getConfig } from '../config/environment';

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
}

/**
 * Email service for sending evaluation result notifications
 * Uses Nodemailer with SMTP configuration from environment variables
 */
export class EmailService {
  private transporter: Transporter | null = null;
  private enabled: boolean;

  constructor() {
    const config = getConfig();
    this.enabled = config.SMTP_ENABLED;

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
      logger.error('Failed to initialize email transporter', { error });
      this.enabled = false;
    }
  }

  /**
   * Send evaluation results to user via email
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

    const { email, name, score, summary, evaluationId } = params;

    try {
      const config = getConfig();
      const fromAddress = config.SMTP_FROM || config.SMTP_USER || 'noreply@visaeval.com';

      const mailOptions = {
        from: fromAddress,
        to: email,
        subject: 'Your Visa Evaluation Results',
        html: this.generateEmailTemplate({ name, score, summary, evaluationId }),
        text: this.generatePlainTextEmail({ name, score, summary, evaluationId })
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Evaluation results email sent successfully', {
        email,
        evaluationId,
        messageId: info.messageId
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
   * Generate HTML email template for evaluation results
   * 
   * @param params - Template parameters
   * @returns HTML string
   * @private
   */
  private generateEmailTemplate(params: Omit<EmailParams, 'email'>): string {
    const { name, score, summary, evaluationId, recommendations, conclusion } = params;

    // Determine score color based on value
    const scoreColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

    // Generate recommendations HTML if available
    const recommendationsHtml = recommendations && recommendations.length > 0 ? `
              <!-- Recommendations -->
              <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 20px; font-weight: bold;">
                  Recommendations
                </h2>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
${recommendations.map(rec => `                  <li style="margin-bottom: 8px;">${rec}</li>`).join('\n')}
                </ul>
              </div>
              ` : '';

    // Generate conclusion HTML if available
    const conclusionHtml = conclusion ? `
              <!-- Conclusion -->
              <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 20px; font-weight: bold;">
                  Conclusion
                </h2>
                <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                  ${conclusion}
                </p>
              </div>
              ` : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visa Evaluation Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #1f2937; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Visa Evaluation Results
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hello <strong>${name}</strong>,
              </p>
              
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.5;">
                Your visa evaluation has been completed. Here are your results:
              </p>
              
              <!-- Score Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      Evaluation Score
                    </p>
                    <p style="margin: 0; color: ${scoreColor}; font-size: 48px; font-weight: bold;">
                      ${score}/100
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Summary -->
              <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 20px; font-weight: bold;">
                  Evaluation Summary
                </h2>
                <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
${summary}
                </p>
              </div>
              ${recommendationsHtml}${conclusionHtml}
              <!-- Evaluation ID -->
              <div style="padding: 20px; background-color: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                  <strong>Evaluation ID:</strong> ${evaluationId}
                </p>
              </div>
              
              <!-- Footer Message -->
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Please keep this evaluation ID for your records. If you have any questions about your results, 
                please contact us with this reference number.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
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
