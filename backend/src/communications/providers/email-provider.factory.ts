import { Injectable } from '@nestjs/common';
import { IEmailProvider } from './email-provider.interface';
import { MockSystemEmailProvider } from './mock.provider';
import { SmtpEmailProvider } from './smtp.provider';
import { SendGridEmailProvider } from './sendgrid.provider';
import { CredentialMasker } from '../utils/credential-masker.util';

@Injectable()
export class EmailProviderFactory {
  createProvider(integration: any): IEmailProvider {
    if (!integration) {
      return new MockSystemEmailProvider();
    }

    const providerType = (integration.provider || 'SYSTEM').toUpperCase();

    // Decrypt credentials for runtime communication
    const decryptedPassword = integration.encryptedPassword
      ? CredentialMasker.decrypt(integration.encryptedPassword)
      : undefined;

    const decryptedApiKey = integration.encryptedApiKey
      ? CredentialMasker.decrypt(integration.encryptedApiKey)
      : undefined;

    switch (providerType) {
      case 'SMTP':
        return new SmtpEmailProvider({
          host: integration.host || 'smtp.example.com',
          port: integration.port || 587,
          secure: integration.secure ?? true,
          username: integration.username,
          password: decryptedPassword,
          fromEmail: integration.fromEmail,
          fromName: integration.fromName,
        });

      case 'SENDGRID':
      case 'RESEND':
        return new SendGridEmailProvider({
          apiKey: decryptedApiKey || '',
          fromEmail: integration.fromEmail,
          fromName: integration.fromName,
        });

      case 'SYSTEM':
      case 'MOCK':
      default:
        return new MockSystemEmailProvider();
    }
  }
}
