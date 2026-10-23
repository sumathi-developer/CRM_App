import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  IEmailProvider,
  SendEmailOptions,
  SendEmailResult,
} from './email-provider.interface';

export class MockSystemEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(MockSystemEmailProvider.name);
  readonly name = 'SYSTEM_MOCK';

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const randomUuid = crypto.randomUUID();
    const generatedMessageId = `<${randomUuid}@crm.local>`;

    this.logger.log(
      `[MockSystemEmailProvider] Dispatched email to [${options.to.join(', ')}] with subject: "${options.subject}" (Message-ID: ${generatedMessageId})`,
    );

    return {
      success: true,
      messageId: generatedMessageId,
      provider: 'SYSTEM_MOCK',
      providerResponse: {
        timestamp: new Date().toISOString(),
        queued: false,
        recipientsCount: options.to.length,
      },
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'System Email Provider connection verified successfully (Ready).',
    };
  }
}
