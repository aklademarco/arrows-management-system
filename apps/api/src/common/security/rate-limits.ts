import { hours, minutes } from '@nestjs/throttler';

export const RATE_LIMITS = {
  general: {
    limit: 100,
    ttl: minutes(1),
  },

  login: {
    limit: 5,
    ttl: minutes(15),
  },

  registration: {
    limit: 5,
    ttl: hours(1),
  },

  passwordResetRequest: {
    limit: 3,
    ttl: hours(1),
  },

  emailVerificationRequest: {
    limit: 3,
    ttl: hours(1),
  },

  accountActionConfirm: {
    limit: 10,
    ttl: minutes(15),
  },

  refresh: {
    limit: 30,
    ttl: minutes(15),
  },

  attendanceCheckIn: {
    limit: 10,
    ttl: minutes(5),
  },

  reports: {
    limit: 20,
    ttl: minutes(5),
  },
} as const;
