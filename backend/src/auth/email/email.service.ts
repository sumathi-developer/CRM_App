
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('MAIL_HOST');
        const port = Number(this.configService.get<string>('MAIL_PORT') || 587);
        const secure =
            this.configService.get<string>('MAIL_SECURE') === 'true' || port === 465;

        const user = this.configService.get<string>('MAIL_USER');
        const password = this.configService.get<string>('MAIL_PASSWORD');

        if (!host || !user || !password) {
            throw new Error(
                'Email configuration is missing. Check MAIL_HOST, MAIL_USER and MAIL_PASSWORD.',
            );
        }

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user,
                pass: password,
            },
        });
    }

    private get sender(): string {
        const name =
            this.configService.get<string>('MAIL_FROM_NAME') || 'CRM';

        const email =
            this.configService.get<string>('MAIL_FROM_EMAIL') ||
            this.configService.get<string>('MAIL_USER');

        return `"${name}" <${email}>`;
    }

    private escapeHtml(value: string): string {
        return value.replace(/[&<>"']/g, (character) => {
            const entities: Record<string, string> = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            };

            return entities[character];
        });
    }

    async sendWelcomeEmail(email: string, name: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.sender,
                to: email,
                subject: 'Welcome to CRM!',
                text: `Hello ${name}, welcome to our CRM platform. Your account has been created successfully.`,
                html: `
          <div style="font-family: Arial, sans-serif; padding: 24px;">
            <h2>Welcome to CRM!</h2>
            <p>Hello ${this.escapeHtml(name)},</p>
            <p>Your account has been created successfully.</p>
            <p>We're glad to have you with us.</p>
          </div>
        `,
            });

            this.logger.log(`Welcome email sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send welcome email to ${email}`,
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    async sendPasswordResetEmail(
        email: string,
        name: string,
        resetLink: string,
    ): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.sender,
                to: email,
                subject: 'Reset your CRM password',
                text: `Hello ${name}, use this link to reset your password: ${resetLink}. This link expires in 1 hour.`,
                html: `
          <div style="font-family: Arial, sans-serif; padding: 24px;">
            <h2>Password Reset Request</h2>
            <p>Hello ${this.escapeHtml(name)},</p>
            <p>We received a request to reset your CRM password.</p>
            <p>
              <a href="${resetLink}"
                 style="background:#062E03;color:#ffffff;padding:12px 20px;
                        text-decoration:none;border-radius:6px;">
                Reset Password
              </a>
            </p>
            <p>This link expires in 1 hour.</p>
            <p>If you did not request this, you can ignore this email.</p>
          </div>
        `,
            });

            this.logger.log(`Password reset email sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send password reset email to ${email}`,
                error instanceof Error ? error.stack : String(error),
            );
        }
    }
}
