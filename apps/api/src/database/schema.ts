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
  integer,
  jsonb,
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

export const reviewDecision = pgEnum('review_decision', [
  'APPROVED',
  'REJECTED',
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
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
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

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
});

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id),
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('user_roles_user_role_unique').on(table.userId, table.roleId),
    index('user_roles_user_idx').on(table.userId),
  ],
);

export const accountReviews = pgTable('account_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  reviewedBy: uuid('reviewed_by')
    .notNull()
    .references(() => users.id),
  previousStatus: accountStatus('previous_status').notNull(),
  newStatus: accountStatus('new_status').notNull(),
  decision: reviewDecision('decision').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    churchId: uuid('church_id')
      .notNull()
      .references(() => churches.id),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    action: varchar('action', { length: 120 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: uuid('entity_id'),
    previousData: jsonb('previous_data'),
    newData: jsonb('new_data'),
    metadata: jsonb('metadata'),
    requestedIp: inet('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('audit_logs_actor_created_idx').on(
      table.actorUserId,
      table.createdAt,
    ),
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
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
