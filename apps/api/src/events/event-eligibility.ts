import { sql, type SQL } from 'drizzle-orm';
import {
  departmentMembers,
  eventDepartments,
  events,
  memberProfiles,
} from '../database/schema';

/**
 * Eligibility model (ERD §5.12): an event with no department assignments is
 * open to every active member; otherwise a member is eligible when they held a
 * membership in one of the assigned departments on the event's start date.
 *
 * The membership period containing a date `D` satisfies
 * `joined_at <= D AND (left_at IS NULL OR D < left_at)`. The reference date is
 * the event's start date in UTC — the schema does not carry a church timezone,
 * so UTC keeps the comparison deterministic regardless of server locale.
 */

/**
 * Condition for a query selecting `FROM events` (unaliased) that keeps only the
 * events the given member profile is eligible to attend.
 */
export function eligibleEventCondition(memberProfileId: string): SQL {
  return sql`(
    NOT EXISTS (
      SELECT 1 FROM ${eventDepartments}
      WHERE ${eventDepartments.eventId} = ${events.id}
    )
    OR EXISTS (
      SELECT 1
      FROM ${eventDepartments}
      JOIN ${departmentMembers}
        ON ${departmentMembers.departmentId} = ${eventDepartments.departmentId}
      WHERE ${eventDepartments.eventId} = ${events.id}
        AND ${departmentMembers.memberId} = ${memberProfileId}
        AND ${departmentMembers.joinedAt} <= (${events.startsAt} AT TIME ZONE 'UTC')::date
        AND (
          ${departmentMembers.leftAt} IS NULL
          OR (${events.startsAt} AT TIME ZONE 'UTC')::date < ${departmentMembers.leftAt}
        )
    )
  )`;
}

/**
 * Condition for a query selecting `FROM member_profiles` (unaliased) that keeps
 * only the members expected at the event — used to resolve the finalization and
 * roster member set. `eventStartDate` is the event's start date as `YYYY-MM-DD`.
 */
export function eligibleMemberCondition(
  eventId: string,
  eventStartDate: string,
): SQL {
  return sql`(
    NOT EXISTS (
      SELECT 1 FROM ${eventDepartments}
      WHERE ${eventDepartments.eventId} = ${eventId}
    )
    OR EXISTS (
      SELECT 1
      FROM ${eventDepartments}
      JOIN ${departmentMembers}
        ON ${departmentMembers.departmentId} = ${eventDepartments.departmentId}
      WHERE ${eventDepartments.eventId} = ${eventId}
        AND ${departmentMembers.memberId} = ${memberProfiles.id}
        AND ${departmentMembers.joinedAt} <= ${eventStartDate}
        AND (
          ${departmentMembers.leftAt} IS NULL
          OR ${eventStartDate} < ${departmentMembers.leftAt}
        )
    )
  )`;
}
