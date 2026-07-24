import {
  index,
  inet,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  text,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const accountStatus = pgEnum('account_status', [
  'PENDING_APPROVAL',
  'ACTIVE',
  'REJECTED',
  'SUSPENDED',
  'ARCHIVED',
]);

export const membershipStatus = pgEnum('membership_status', [
  'ACTIVE',
  'INACTIVE',
  'ON_LEAVE',
  'ARCHIVED',
]);

export const accountActionTokenType = pgEnum('account_action_token_type', [
  'EMAIL_VERIFICATION',
  'PASSWORD_RESET',
]);

export const churches = pgTable('churches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    churchId: uuid('church_id')
      .notNull()
      .references(() => churches.id),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 30 }),
    passwordHash: text('password_hash').notNull(),
    accountStatus: accountStatus('account_status')
      .notNull()
      .default('PENDING_APPROVAL'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_unique').on(table.email),
    uniqueIndex('users_phone_unique')
      .on(table.phone)
      .where(sql`${table.phone} is not null`),
    index('users_account_status_idx').on(table.accountStatus),
  ],
);

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  churchId: uuid('church_id')
    .notNull()
    .references(() => churches.id),
  name: varchar('name', { length: 120 }).notNull(),
});

export const memberProfiles = pgTable('member_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  otherNames: varchar('other_names', { length: 150 }),
  requestedDepartmentId: uuid('requested_department_id').references(
    () => departments.id,
  ),
  membershipStatus: membershipStatus('membership_status')
    .notNull()
    .default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accountActionTokens = pgTable(
  'account_action_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    type: accountActionTokenType('type').notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    requestedIp: inet('requested_ip'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('account_action_tokens_user_type_idx').on(
      table.userId,
      table.type,
      table.createdAt,
    ),
  ],
);
