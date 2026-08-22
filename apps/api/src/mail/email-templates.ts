import type { PasswordResetEmail, VerificationEmail } from './email-delivery';

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] ?? character,
  );
}

export type EmailBody = {
  subject: string;
  text: string;
  html: string;
};

export function verificationEmailBody(
  message: VerificationEmail,
  webUrl: string,
): EmailBody {
  const verificationUrl = new URL('/verify-email', webUrl);
  verificationUrl.searchParams.set('token', message.token);
  const safeFirstName = escapeHtml(message.firstName);
  const safeVerificationUrl = escapeHtml(verificationUrl.toString());
  return {
    subject: 'Verify your Arrows member account',
    text: [
      `Hello ${message.firstName},`,
      '',
      'Verify your email address to continue your Arrows member registration:',
      verificationUrl.toString(),
      '',
      'This link expires in 24 hours and can be used only once.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e293b">
        <h1 style="color:#240046">Verify your email address</h1>
        <p>Hello ${safeFirstName},</p>
        <p>Verify your email address to continue your Arrows member registration.</p>
        <p>
          <a href="${safeVerificationUrl}"
             style="display:inline-block;padding:12px 20px;border-radius:10px;background:#240046;color:#fff;text-decoration:none;font-weight:700">
            Verify email
          </a>
        </p>
        <p>This link expires in 24 hours and can be used only once.</p>
      </div>
    `,
  };
}

export function passwordResetEmailBody(
  message: PasswordResetEmail,
  webUrl: string,
): EmailBody {
  const resetUrl = new URL('/reset-password', webUrl);
  resetUrl.searchParams.set('token', message.token);
  const safeFirstName = escapeHtml(message.firstName);
  const safeResetUrl = escapeHtml(resetUrl.toString());
  return {
    subject: 'Reset your Arrows member password',
    text: [
      `Hello ${message.firstName},`,
      '',
      'We received a request to reset your Arrows member password.',
      'Use the link below to choose a new password:',
      resetUrl.toString(),
      '',
      'This link expires in 30 minutes and can be used only once.',
      'If you did not request this, you can safely ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e293b">
        <h1 style="color:#240046">Reset your password</h1>
        <p>Hello ${safeFirstName},</p>
        <p>We received a request to reset your Arrows member password.</p>
        <p>
          <a href="${safeResetUrl}"
             style="display:inline-block;padding:12px 20px;border-radius:10px;background:#240046;color:#fff;text-decoration:none;font-weight:700">
            Reset password
          </a>
        </p>
        <p>This link expires in 30 minutes and can be used only once.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  };
}
