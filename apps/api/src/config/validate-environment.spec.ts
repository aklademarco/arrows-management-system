import { validateEnvironment } from './validate-environment';

const validProductionEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://database',
  CORS_ORIGIN: 'https://app.example.com',
  WEB_URL: 'https://app.example.com',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  SMTP_HOST: 'smtp.example.com',
  SMTP_FROM: 'ACMS <no-reply@example.com>',
  CLOUDINARY_CLOUD_NAME: 'example',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
};

describe('validateEnvironment', () => {
  it('allows local development without production-only services', () => {
    expect(() =>
      validateEnvironment({ NODE_ENV: 'development' }),
    ).not.toThrow();
  });

  it('rejects missing production configuration', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
      'Missing required production environment variables',
    );
  });

  it('rejects a short JWT secret', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionEnvironment,
        JWT_ACCESS_SECRET: 'short',
      }),
    ).toThrow('at least 32 characters');
  });

  it('accepts complete secure production configuration', () => {
    expect(() => validateEnvironment(validProductionEnvironment)).not.toThrow();
  });
});
