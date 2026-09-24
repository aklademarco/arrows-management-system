const PRODUCTION_REQUIRED = [
  'DATABASE_URL',
  'CORS_ORIGIN',
  'WEB_URL',
  'JWT_ACCESS_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
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

  const emailFrom = environment.EMAIL_FROM ?? '';
  const senderAddress = emailFrom.match(/<([^>]+)>/i)?.[1] ?? emailFrom;
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(senderAddress) ||
    senderAddress.toLowerCase().endsWith('.local')
  ) {
    throw new Error(
      'EMAIL_FROM must contain an address on a verified Resend sending domain.',
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

  if (environment.SMS_ENABLED === 'true') {
    const missingSms = ['MOOLRE_SMS_VAS_KEY', 'MOOLRE_SENDER_ID'].filter(
      (name) => !environment[name]?.trim(),
    );
    if (missingSms.length)
      throw new Error(`SMS_ENABLED requires: ${missingSms.join(', ')}`);
    if ((environment.MOOLRE_SENDER_ID?.length ?? 0) > 11)
      throw new Error('MOOLRE_SENDER_ID must contain at most 11 characters.');
  }
}
