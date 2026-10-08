import { validateEnvironment } from './validate-environment';

const validProductionEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://database',
  CORS_ORIGIN: 'https://app.example.com',
  WEB_URL: 'https://app.example.com',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  RESEND_API_KEY: 're_example',
  EMAIL_FROM: 'ACMS <no-reply@example.com>',
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

  it('rejects a local Resend sender domain', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionEnvironment,
        EMAIL_FROM: 'Arrows <no-reply@arrows.local>',
      }),
    ).toThrow('verified Resend sending domain');
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

  it('requires every Hubtel credential when SMS is enabled', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionEnvironment,
        SMS_ENABLED: 'true',
        HUBTEL_CLIENT_ID: 'client-id',
      }),
    ).toThrow('HUBTEL_CLIENT_SECRET, HUBTEL_SENDER_ID');
  });

  it('accepts a complete Hubtel SMS configuration', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionEnvironment,
        SMS_ENABLED: 'true',
        HUBTEL_CLIENT_ID: 'client-id',
        HUBTEL_CLIENT_SECRET: 'client-secret',
        HUBTEL_SENDER_ID: 'ARROWS',
      }),
    ).not.toThrow();
  });

  it('rejects an invalid Hubtel sender ID', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionEnvironment,
        SMS_ENABLED: 'true',
        HUBTEL_CLIENT_ID: 'client-id',
        HUBTEL_CLIENT_SECRET: 'client-secret',
        HUBTEL_SENDER_ID: 'ARROWS CHURCH',
      }),
    ).toThrow('1 to 11 alphanumeric characters');
  });

  it('requires an HTTPS Hubtel base URL in production', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionEnvironment,
        SMS_ENABLED: 'true',
        HUBTEL_CLIENT_ID: 'client-id',
        HUBTEL_CLIENT_SECRET: 'client-secret',
        HUBTEL_SENDER_ID: 'ARROWS',
        HUBTEL_BASE_URL: 'http://sms.example.test/v1',
      }),
    ).toThrow('HUBTEL_BASE_URL must use HTTPS');
  });
});
