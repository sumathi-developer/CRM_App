import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'crm-super-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'crm-refresh-token-secret-key-2026',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
}));
