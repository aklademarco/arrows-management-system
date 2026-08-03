import {
  check,
  boolean,
  date,
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
  numeric,
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

export const eventStatus = pgEnum('event_status', [
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'CANCELLED',
  'COMPLETED',
]);

export const attendanceStatus = pgEnum('attendance_status', [
  'EARLY',
  'ON_TIME',
  'LATE',
  'ABSENT',
  'EXCUSED',
]);

export const attendanceMethod = pgEnum('attendance_method', [
  'GEOLOCATION',
  'MANUAL',
  'SYSTEM',
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

export const departments = pgTable(
  'departments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    churchId: uuid('church_id')
      .notNull()
      .references(() => churches.id),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('departments_church_slug_unique').on(
      table.churchId,
      table.slug,
    ),
  ],
);

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

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    churchId: uuid('church_id')
      .notNull()
      .references(() => churches.id),
    name: varchar('name', { length: 180 }).notNull(),
    eventType: varchar('event_type', { length: 80 }).notNull(),
    description: text('description'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    attendanceOpensAt: timestamp('attendance_opens_at', {
      withTimezone: true,
    }).notNull(),
    attendanceClosesAt: timestamp('attendance_closes_at', {
      withTimezone: true,
    }).notNull(),
    earlyUntil: timestamp('early_until', { withTimezone: true }),
    lateAfter: timestamp('late_after', { withTimezone: true }).notNull(),
    locationName: varchar('location_name', { length: 180 }),
    latitude: numeric('latitude', { precision: 9, scale: 6 }).notNull(),
    longitude: numeric('longitude', { precision: 9, scale: 6 }).notNull(),
    geofenceRadiusMeters: integer('geofence_radius_meters').notNull(),
    maximumAccuracyMeters: integer('maximum_accuracy_meters')
      .notNull()
      .default(50),
    status: eventStatus('status').notNull().default('DRAFT'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledBy: uuid('cancelled_by').references(() => users.id),
    cancellationReason: text('cancellation_reason'),
    attendanceFinalizedAt: timestamp('attendance_finalized_at', {
      withTimezone: true,
    }),
    attendanceFinalizedBy: uuid('attendance_finalized_by').references(
      () => users.id,
    ),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('events_status_start_idx').on(table.status, table.startsAt),
    index('events_attendance_window_idx').on(
      table.attendanceOpensAt,
      table.attendanceClosesAt,
    ),
  ],
);

export const attendanceRecords = pgTable(
  'attendance_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    memberId: uuid('member_id')
      .notNull()
      .references(() => memberProfiles.id),
    status: attendanceStatus('status').notNull(),
    method: attendanceMethod('method').notNull(),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
    latitude: numeric('latitude', { precision: 9, scale: 6 }),
    longitude: numeric('longitude', { precision: 9, scale: 6 }),
    accuracyMeters: numeric('accuracy_meters', {
      precision: 10,
      scale: 2,
    }),
    distanceMeters: numeric('distance_meters', {
      precision: 10,
      scale: 2,
    }),
    withinGeofence: boolean('within_geofence'),
    markedBy: uuid('marked_by').references(() => users.id),
    manualReason: text('manual_reason'),
    reviewNote: text('review_note'),
    pointsAwarded: integer('points_awarded').notNull().default(10),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('attendance_event_member_unique').on(
      table.eventId,
      table.memberId,
    ),
    index('attendance_member_checked_in_idx').on(
      table.memberId,
      table.checkedInAt,
    ),
    index('attendance_event_status_idx').on(table.eventId, table.status),
  ],
);

export const departmentMembers = pgTable(
  'department_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id),
    memberId: uuid('member_id')
      .notNull()
      .references(() => memberProfiles.id),
    joinedAt: date('joined_at').notNull(),
    leftAt: date('left_at'),
    assignedBy: uuid('assigned_by').references(() => users.id),
    endedBy: uuid('ended_by').references(() => users.id),
    endReason: text('end_reason'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('department_members_department_member_dates_idx').on(
      table.departmentId,
      table.memberId,
      table.joinedAt,
      table.leftAt,
    ),
    index('department_members_member_idx').on(table.memberId),
    check(
      'department_members_valid_date_range',
      sql`${table.leftAt} is null or ${table.leftAt} > ${table.joinedAt}`,
    ),
    check(
      'department_members_valid_end_metadata',
      sql`(${table.leftAt} is null and ${table.endedBy} is null and ${table.endReason} is null) or (${table.leftAt} is not null and ${table.endedBy} is not null and ${table.endReason} is not null and char_length(btrim(${table.endReason})) > 0)`,
    ),
  ],
);

export const primaryDepartmentAssignments = pgTable(
  'primary_department_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => memberProfiles.id),
    departmentMembershipId: uuid('department_membership_id')
      .notNull()
      .references(() => departmentMembers.id),
    startsAt: date('starts_at').notNull(),
    endsAt: date('ends_at'),
    assignedBy: uuid('assigned_by')
      .notNull()
      .references(() => users.id),
    endedBy: uuid('ended_by').references(() => users.id),
    endReason: text('end_reason'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('primary_department_assignments_member_dates_idx').on(
      table.memberId,
      table.startsAt,
      table.endsAt,
    ),
    index('primary_department_assignments_membership_idx').on(
      table.departmentMembershipId,
    ),
    check(
      'primary_department_assignments_valid_date_range',
      sql`${table.endsAt} is null or ${table.endsAt} >= ${table.startsAt}`,
    ),
    check(
      'primary_department_assignments_valid_end_metadata',
      sql`(${table.endsAt} is null and ${table.endedBy} is null and ${table.endReason} is null) or (${table.endsAt} is not null and ${table.endedBy} is not null and ${table.endReason} is not null and char_length(btrim(${table.endReason})) > 0)`,
    ),
  ],
);

export const departmentLeaders = pgTable(
  'department_leaders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id),
    memberId: uuid('member_id')
      .notNull()
      .references(() => memberProfiles.id),
    title: varchar('title', { length: 100 }),
    startsAt: date('starts_at').notNull(),
    endsAt: date('ends_at'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedBy: uuid('revoked_by').references(() => users.id),
    revocationReason: text('revocation_reason'),
    assignedBy: uuid('assigned_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('department_leaders_assignment_unique').on(
      table.departmentId,
      table.memberId,
      table.startsAt,
    ),
    index('department_leaders_member_dates_idx').on(
      table.memberId,
      table.revokedAt,
      table.startsAt,
      table.endsAt,
    ),
    index('department_leaders_department_dates_idx').on(
      table.departmentId,
      table.revokedAt,
      table.startsAt,
      table.endsAt,
    ),
    check(
      'department_leaders_valid_date_range',
      sql`${table.endsAt} is null or ${table.endsAt} >= ${table.startsAt}`,
    ),
    check(
      'department_leaders_valid_revocation',
      sql`(${table.revokedAt} is null and ${table.revokedBy} is null and ${table.revocationReason} is null) or (${table.revokedAt} is not null and ${table.revokedBy} is not null and ${table.revocationReason} is not null and char_length(btrim(${table.revocationReason})) > 0)`,
    ),
  ],
);

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
