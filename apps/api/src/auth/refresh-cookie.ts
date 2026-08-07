import type { Request, Response } from 'express';

/**
 * Refresh tokens travel only in an HTTP-only cookie scoped to the auth routes,
 * so they are never exposed to client-side JavaScript or sent with other
 * requests. The value itself is an opaque high-entropy token; only its hash is
 * persisted (see RefreshTokenRepository).
 */
export const REFRESH_COOKIE_NAME = 'arrows_refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function setRefreshCookie(
  response: Response,
  token: string,
  expiresAt: Date,
): void {
  response.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  });
}

export function clearRefreshCookie(response: Response): void {
  response.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
  });
}

/** Reads the refresh cookie without depending on cookie-parser middleware. */
export function readRefreshCookie(request: Request): string | undefined {
  const header = request.headers.cookie;
  if (!header) {
    return undefined;
  }
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) {
      continue;
    }
    if (part.slice(0, index).trim() === REFRESH_COOKIE_NAME) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return undefined;
}
