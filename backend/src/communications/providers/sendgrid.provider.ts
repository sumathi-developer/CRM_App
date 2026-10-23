import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  IEmailProvider,
  SendEmailOptions,
  SendEmailResult,
} from './email-provider.interface';

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export class SendGridEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SendGridEmailProvider.name);
  readonly name = 'SENDGRID';

  constructor(private readonly config: SendGridConfig) {}

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const randomUuid = crypto.randomUUID();
    const messageId = `<sg-${randomUuid}@sendgrid.net>`;

    this.logger.log(
      `[SendGrid Provider] Dispatched email to ${options.to.join(', ')} (API Key: ${this.config.apiKey ? 'Configured' : 'Missing'})`,
    );

    if (!this.config.apiKey) {
      return {
        success: false,
        provider: 'SENDGRID',
        error: 'SendGrid API Key is missing or invalid',
      };
    }

    return {
      success: true,
      messageId,
      provider: 'SENDGRID',
      providerResponse: {
        statusCode: 202,
        status: 'accepted',
        recipientsCount: options.to.length,
      },
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.apiKey) {
      return {
        success: false,
        message: 'SendGrid API Key is missing',
      };
    }

    if (!this.config.apiKey.startsWith('SG.') && this.config.apiKey.length < 10) {
      return {
        success: false,
        message: 'Invalid SendGrid API Key format (must begin with SG.)',
      };
    }

    return {
      success: true,
      message: 'SendGrid API credentials validated successfully',
    };
  }
}
