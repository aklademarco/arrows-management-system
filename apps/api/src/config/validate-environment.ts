const PRODUCTION_REQUIRED = [
  'DATABASE_URL',
  'CORS_ORIGIN',
  'WEB_URL',
  'JWT_ACCESS_SECRET',
  'SMTP_HOST',
  'SMTP_FROM',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

export function validateEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): void {
  if (environment.NODE_ENV !== 'production') return;

  const missing = PRODUCTION_REQUIRED.filter(
    (name) => !environment[name]?.trim(),
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}`,
    );
  }

  if ((environment.JWT_ACCESS_SECRET?.length ?? 0) < 32) {
    throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters.');
  }

  for (const name of ['CORS_ORIGIN', 'WEB_URL'] as const) {
    const value = environment[name];
    if (!value?.startsWith('https://')) {
      throw new Error(`${name} must use HTTPS in production.`);
    }
  }
}
