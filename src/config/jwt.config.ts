import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
  expiresIn: process.env.JWT_EXPIRATION || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_in_production',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));

export default jwtConfig;
