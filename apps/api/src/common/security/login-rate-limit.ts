import type { Request } from 'express';

type LoginRequestBody = {
  email?: unknown;
};

/**
 * Keep login attempts isolated by account and client. This prevents members
 * sharing a church network or the web application's server from exhausting
 * one another's login allowance.
 */
export function getLoginAttemptTracker(request: Record<string, unknown>) {
  const loginRequest = request as unknown as Request<
    Record<string, string>,
    unknown,
    LoginRequestBody
  >;
  const rawEmail = loginRequest.body?.email;
  const email =
    typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
  const clientIp = loginRequest.ip || 'unknown';

  if (!email) {
    return `login-ip:${clientIp}`;
  }

  return `login-account:${email}:ip:${clientIp}`;
}
