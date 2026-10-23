export interface EmailAttachmentPayload {
  filename: string;
  contentType?: string;
  size?: number;
  path?: string;
  url?: string;
  content?: string | Buffer;
}

export interface SendEmailOptions {
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachmentPayload[];
  headers?: Record<string, string>;
  threadId?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider: string;
  providerResponse?: any;
  error?: string;
}

export interface IEmailProvider {
  readonly name: string;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
  testConnection(): Promise<{ success: boolean; message: string }>;
}
