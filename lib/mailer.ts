import nodemailer from 'nodemailer';

interface MailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class MailerSingleton {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
      console.warn('SMTP configuration incomplete. Email functionality will be disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: false, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      this.isConfigured = true;
      console.log('SMTP transporter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SMTP transporter:', error);
      this.isConfigured = false;
    }
  }

  async sendMail({ to, subject, body }: { to: string; subject: string; body: string }): Promise<MailResult> {
    if (!this.isConfigured || !this.transporter) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const info = await this.transporter.sendMail({
          from: process.env.SMTP_FROM,
          to,
          subject,
          text: body,
          html: `<pre>${body}</pre>` // Simple HTML formatting
        });

        return {
          success: true,
          messageId: info.messageId
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`Email send attempt ${attempt} failed:`, error);

        // Don't retry for certain types of errors
        if (error instanceof Error && (
          error.message.includes('Invalid email') ||
          error.message.includes('Recipient address rejected') ||
          error.message.includes('Authentication failed')
        )) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error occurred'
    };
  }

  isEmailConfigured(): boolean {
    return this.isConfigured;
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mailer = new MailerSingleton();
