import * as crypto from 'crypto';

/**
 * Utility for encrypting and sanitizing provider credentials.
 * Ensures credentials (SMTP passwords, SendGrid/Resend API keys) are
 * securely encrypted in the database and NEVER exposed over API endpoints.
 */
export class CredentialMasker {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly IV_LENGTH = 16;

  private static getEncryptionKey(): Buffer {
    const secret =
      process.env.APP_SECRET ||
      process.env.JWT_SECRET ||
      'crm-default-secure-communications-key-2026';
    return crypto.createHash('sha256').update(secret).digest();
  }

  /**
   * Encrypt a plaintext secret (password or API key) for secure database storage.
   */
  static encrypt(plainText: string): string {
    if (!plainText) return '';
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.getEncryptionKey(), iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt an encrypted secret for internal provider communication only.
   */
  static decrypt(cipherText: string): string {
    if (!cipherText) return '';
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 2) return '';
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedData = parts[1];
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.getEncryptionKey(), iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '';
    }
  }

  /**
   * Create a masked preview of a secret string (e.g. "SG.************a3f2").
   */
  static mask(secret: string): string {
    if (!secret) return '';
    if (secret.length <= 6) return '******';
    const prefix = secret.slice(0, 3);
    const suffix = secret.slice(-3);
    return `${prefix}******${suffix}`;
  }

  /**
   * Sanitize an integration record to remove raw encrypted credentials
   * and replace them with safe masked representations.
   */
  static sanitizeIntegration(integration: any): any {
    if (!integration) return null;
    const sanitized = { ...integration };

    // Remove raw encrypted fields
    const hasPassword = Boolean(sanitized.encryptedPassword);
    const hasApiKey = Boolean(sanitized.encryptedApiKey);

    delete sanitized.encryptedPassword;
    delete sanitized.encryptedApiKey;

    // Add safe metadata indicators
    sanitized.hasPassword = hasPassword;
    sanitized.hasApiKey = hasApiKey;
    sanitized.passwordMasked = hasPassword ? '••••••••' : null;
    sanitized.apiKeyMasked = hasApiKey ? '••••••••••••' : null;

    return sanitized;
  }
}
