# REST API Specification

## Arrows Church Management System (ACMS)

**Version:** 1.0  
**Status:** Draft  
**API Style:** REST  
**Base Path:** `/api/v1`  
**Backend:** NestJS  
**Database:** PostgreSQL  

---

## 1. Purpose

This document defines the initial REST API contract for the Arrows Church Management System.

The API supports:

- Public user registration
- Administrator approval
- Authentication and session renewal
- Member and department management
- Event management
- Geofence-based attendance
- Manual attendance
- Absence requests
- Leaderboards
- Reports
- Audit logs

---

## 2. General Conventions

### 2.1 Base URL

Development:

```text
http://localhost:4000/api/v1
```

Production example:

```text
https://api.arrows.example.com/api/v1
```

### 2.2 Content Type

All request and response bodies shall use:

```http
Content-Type: application/json
```

### 2.3 Authentication

Protected routes require an access token.

Recommended approach:

- Short-lived JWT access token
- Rotating refresh token
- Refresh token stored in a secure, HTTP-only cookie
- Access token sent through an authorization header or secure cookie

Example header:

```http
Authorization: Bearer <access-token>
```

### 2.4 Server Time

All attendance decisions shall use server time.

Clients may display local time, but client-provided timestamps shall not determine:

- Whether attendance is open
- Whether a user is early
- Whether a user is on time
- Whether a user is late

### 2.5 Date Format

Use ISO 8601 timestamps in UTC.

```text
2026-07-22T08:30:00.000Z
```

### 2.6 Identifier Format

All primary identifiers shall use UUIDs.

---

## 3. Standard Response Format

### 3.1 Successful Response

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

### 3.2 Paginated Response

```json
{
  "success": true,
  "message": "Members retrieved successfully.",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 0,
      "totalPages": 0
    }
  }
}
```

### 3.3 Error Response

```json
{
  "success": false,
  "message": "Validation failed.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Email must be valid."
      }
    ]
  }
}
```

---

## 4. Standard Error Codes

| Code | HTTP Status | Description |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Request data is invalid |
| `INVALID_CREDENTIALS` | 401 | Login details are incorrect |
| `UNAUTHENTICATED` | 401 | Access token is missing or invalid |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `INVALID_ACCOUNT_ACTION_TOKEN` | 400 | Verification or reset token is invalid, expired, used, or revoked |
| `FORBIDDEN` | 403 | User lacks permission |
| `ACCOUNT_PENDING` | 403 | Account is awaiting approval |
| `ACCOUNT_REJECTED` | 403 | Account has been rejected |
| `ACCOUNT_SUSPENDED` | 403 | Account is suspended |
| `EMAIL_NOT_VERIFIED` | 422 | Account email must be verified before approval |
| `DEPARTMENT_SCOPE_FORBIDDEN` | 403 | Department leader lacks an active assignment for the requested resource |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Request conflicts with existing data |
| `DUPLICATE_ATTENDANCE` | 409 | Member already checked in |
| `ATTENDANCE_CONFLICT` | 409 | Requested absence or correction conflicts with a protected attendance outcome |
| `EVENT_NOT_CANCELLABLE` | 409 | Event is completed, finalized, or otherwise cannot be cancelled |
| `ATTENDANCE_CLOSED` | 422 | Attendance window is not open |
| `OUTSIDE_GEOFENCE` | 422 | User is outside the allowed radius |
| `POOR_LOCATION_ACCURACY` | 422 | Reported location accuracy is unacceptable |
| `EVENT_NOT_ELIGIBLE` | 422 | Member is not eligible for the event |
| `LEADERBOARDS_DISABLED` | 403 | Member-visible leaderboards are disabled |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

# 5. Authentication API

## 5.1 Register Account

```http
POST /auth/register
```

**Access:** Public

### Request

```json
{
  "firstName": "Bismark",
  "lastName": "Marco",
  "otherNames": null,
  "email": "bismark@example.com",
  "phone": "+233240000000",
  "password": "StrongPassword123!",
  "requestedDepartmentId": "4aefc243-f9be-4bd0-b420-752eb9ec04d5"
}
```

### Rules

- Email must be unique.
- Phone must be unique when provided.
- Password must meet configured security rules.
- Requested department is a preference only.
- New account status must be `PENDING_APPROVAL`.
- A 24-hour email-verification token must be issued.
- No trusted role may be assigned automatically.

### Response

**Status:** `201 Created`

```json
{
  "success": true,
  "message": "Registration received. Verify your email before administrator approval.",
  "data": {
    "userId": "a65d7e4f-9dd6-40b5-8c83-431bd84f9f57",
    "accountStatus": "PENDING_APPROVAL",
    "emailVerificationRequired": true
  }
}
```

---

## 5.2 Login

```http
POST /auth/login
```

**Access:** Public

### Request

```json
{
  "email": "bismark@example.com",
  "password": "StrongPassword123!"
}
```

### Response

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "a65d7e4f-9dd6-40b5-8c83-431bd84f9f57",
      "accountStatus": "ACTIVE",
      "roles": ["MEMBER"]
    }
  }
}
```

### Account Status Handling

- `PENDING_APPROVAL`: allow limited login and return approval status.
- `REJECTED`: deny protected access.
- `SUSPENDED`: deny protected access.
- `ACTIVE`: allow normal access.

---

## 5.3 Refresh Access Token

```http
POST /auth/refresh
```

**Access:** Refresh token required

### Response

```json
{
  "success": true,
  "message": "Access token refreshed.",
  "data": {
    "accessToken": "<new-jwt>"
  }
}
```

The previous refresh token should be rotated and invalidated.

---

## 5.4 Logout

```http
POST /auth/logout
```

**Access:** Authenticated

### Response

```json
{
  "success": true,
  "message": "Logged out successfully.",
  "data": null
}
```

---

## 5.5 Get Current Account

```http
GET /auth/me
```

**Access:** Authenticated

### Response

```json
{
  "success": true,
  "message": "Account retrieved successfully.",
  "data": {
    "id": "a65d7e4f-9dd6-40b5-8c83-431bd84f9f57",
    "email": "bismark@example.com",
    "emailVerifiedAt": "2026-07-22T09:00:00.000Z",
    "phone": "+233240000000",
    "accountStatus": "ACTIVE",
    "roles": ["MEMBER"],
    "memberProfile": {
      "id": "ce686f62-3e76-4f41-aef2-c9d376a52906",
      "firstName": "Bismark",
      "lastName": "Marco",
      "primaryDepartment": {
        "id": "4aefc243-f9be-4bd0-b420-752eb9ec04d5",
        "name": "Media"
      }
    }
  }
}
```

`primaryDepartment` is derived from the `primary_department_assignments` period active on the current church-local date. It is `null` when no assignment is active.

---

## 5.6 Request Password Reset

```http
POST /auth/password-reset/request
```

**Access:** Public

### Request

```json
{
  "email": "bismark@example.com"
}
```

The response should not reveal whether the account exists.

### Response

```json
{
  "success": true,
  "message": "If an eligible account exists, password-reset instructions have been sent.",
  "data": null
}
```

### Rules

- Apply the same response and similar timing whether or not the account exists.
- Create a cryptographically random high-entropy token.
- Persist only its SHA-256 hash.
- Set expiry to 30 minutes.
- Revoke prior unused password-reset tokens for the user.
- Never log the raw token or include it in API response data.

---

## 5.7 Complete Password Reset

```http
POST /auth/password-reset/confirm
```

**Access:** Public

### Request

```json
{
  "token": "<reset-token>",
  "newPassword": "NewStrongPassword123!"
}
```

### Transaction

The backend shall:

1. Hash and validate the submitted token.
2. Reject tokens that are expired, used, or revoked.
3. Update the Argon2 password hash.
4. Reset failed login attempts and clear the account lock.
5. Mark the token as used.
6. Revoke other unused password-reset tokens.
7. Revoke all refresh-token sessions for the user.
8. Record a password-reset completion audit event without sensitive values.

Token consumption and database updates must be atomic. A consumed token must never work again.

### Response

```json
{
  "success": true,
  "message": "Password reset successfully. Sign in again on all devices.",
  "data": null
}
```

---

## 5.8 Request Email Verification

```http
POST /auth/email-verification/request
```

**Access:** Public or limited pending-user session

### Request

```json
{
  "email": "bismark@example.com"
}
```

The endpoint shall return the same generic response for unknown, already verified, rejected, and eligible pending accounts.

```json
{
  "success": true,
  "message": "If verification is required, instructions have been sent.",
  "data": null
}
```

Eligible requests create a high-entropy token that expires after 24 hours, persist only its SHA-256 hash, and revoke prior unused email-verification tokens.

---

## 5.9 Confirm Email Verification

```http
POST /auth/email-verification/confirm
```

**Access:** Public

### Request

```json
{
  "token": "<verification-token>"
}
```

### Transaction

The backend shall atomically validate and lock the token, set `users.email_verified_at` using server time, mark the token as used, revoke other unused email-verification tokens for the user, and record a verification audit event without the token value.

```json
{
  "success": true,
  "message": "Email verified. Your registration is ready for administrator review.",
  "data": {
    "emailVerified": true,
    "accountStatus": "PENDING_APPROVAL"
  }
}
```

---

# 6. Account Approval API

## 6.1 List Pending Registrations

```http
GET /admin/registrations
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Query Parameters

```text
status=PENDING_APPROVAL
page=1
limit=20
search=bismark
requestedDepartmentId=<uuid>
```

---

## 6.2 Get Registration

```http
GET /admin/registrations/:userId
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

---

## 6.3 Approve Registration

```http
POST /admin/registrations/:userId/approve
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "primaryDepartmentId": "4aefc243-f9be-4bd0-b420-752eb9ec04d5",
  "additionalDepartmentIds": [],
  "roleNames": ["MEMBER"],
  "note": "Membership confirmed."
}
```

### Transaction

The backend should:

1. Validate that the account is pending.
2. Validate that `email_verified_at` is not null.
3. Change account status to `ACTIVE`.
4. Create or update the member profile.
5. Create confirmed department-membership periods.
6. Create the initial primary-department assignment referencing the confirmed primary membership.
7. Assign approved roles.
8. Create an account review record.
9. Create an audit log.

---

## 6.4 Reject Registration

```http
POST /admin/registrations/:userId/reject
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "reason": "Unable to verify membership."
}
```

---

## 6.5 Suspend User

```http
POST /admin/users/:userId/suspend
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "reason": "Administrative review required."
}
```

---

## 6.6 Reactivate User

```http
POST /admin/users/:userId/reactivate
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

---

# 7. Member API

## 7.1 List Members

```http
GET /members
```

**Roles:** `SUPER_ADMIN`, `ADMIN`, `DEPARTMENT_LEADER`

### Query Parameters

```text
page=1
limit=20
search=marco
departmentId=<uuid>
membershipStatus=ACTIVE
accountStatus=ACTIVE
```

Department leaders receive only members who share at least one actively led department. If `departmentId` is supplied, it must be actively led. Leader responses must omit account-security and unrelated-department fields.

---

## 7.2 Get Member

```http
GET /members/:memberId
```

**Roles:** Authorized staff or the member themself

A department leader may retrieve another member only when both currently belong to a department the requester actively leads. Authorization must be enforced in the database query or service before returning data.

Scoped object lookups return `NOT_FOUND` when the record is missing or outside the leader's scope, avoiding disclosure of out-of-scope member data.

---

## 7.3 Update Own Profile

```http
PATCH /members/me
```

**Roles:** `MEMBER`, `DEPARTMENT_LEADER`, `ATTENDANCE_OFFICER`, `ADMIN`

### Request

```json
{
  "firstName": "Bismark",
  "lastName": "Marco",
  "otherNames": null,
  "phone": "+233240000000"
}
```

Members must not change their own:

- Account status
- Roles
- Approved departments
- Membership status

---

## 7.4 Update Member

```http
PATCH /members/:memberId
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

---

## 7.5 Archive Member

```http
POST /members/:memberId/archive
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

Historical attendance must remain intact.

---

## 7.6 Set or Clear Primary Department

```http
PUT /members/:memberId/primary-department
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "departmentMembershipId": "62296940-eed9-4cc9-9fd9-5709bd8e1e84",
  "effectiveOn": "2026-08-01",
  "reason": "Member transferred primary responsibility."
}
```

Use `departmentMembershipId: null` to clear the primary designation. `effectiveOn` defaults to the current date in the church timezone and cannot be in the past in Version 1. The reason must contain meaningful non-whitespace text.

### Transaction

The backend shall:

1. Lock the member's primary assignments and the proposed supporting membership.
2. Validate that the membership belongs to the member and contains `effectiveOn`.
3. End the existing primary assignment at `effectiveOn` when one exists.
4. Create the replacement assignment when `departmentMembershipId` is not null.
5. Preserve prior primary history without changing department-membership periods.
6. Create an audit log.

The operation must satisfy the non-overlapping primary-period exclusion constraint. A repeated request producing the same effective state is idempotent.

---

# 8. Department API

## 8.1 List Departments

```http
GET /departments
```

**Access:** Active authenticated users

---

## 8.2 Create Department

```http
POST /departments
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "name": "Media",
  "description": "Handles photography, video, graphics, and live streaming."
}
```

---

## 8.3 Get Department

```http
GET /departments/:departmentId
```

**Access:** Active authenticated users

---

## 8.4 Update Department

```http
PATCH /departments/:departmentId
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

---

## 8.5 Add Department Member

```http
POST /departments/:departmentId/members
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "memberId": "ce686f62-3e76-4f41-aef2-c9d376a52906",
  "makePrimary": true,
  "joinedAt": "2026-07-22"
}
```

Each request creates a new open-ended membership period. `joinedAt` defaults to the current date in the church timezone. Immediate or scheduled endings must use the audited end-membership endpoint.

The transaction shall lock relevant membership periods, reject any overlap for the same member and department, and create an audit log. When `makePrimary` is true, it shall call the primary-department assignment service using the new membership period. A member who previously left the department rejoins through a new period rather than reopening or overwriting the old row.

---

## 8.6 End Department Membership

```http
POST /departments/:departmentId/memberships/:membershipId/end
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "leftAt": "2026-08-01",
  "reason": "Member transferred to another department.",
  "replacementPrimaryMembershipId": null
}
```

`leftAt` is the first inactive date and defaults to the current church-local date when valid. It must be later than `joinedAt`. The reason must contain meaningful non-whitespace text.

The backend shall lock the exact membership period, validate that it belongs to the route department, set `leftAt`, `endedBy`, `endReason`, and `updatedAt`, and create an audit log. The record must never be deleted.

If an active or future primary assignment depends on this membership beyond `leftAt`, the transaction must end that assignment at `leftAt`. It may create a valid replacement supplied by the administrator with the same effective date; otherwise the member temporarily has no primary department. Ending membership removes any department-leader scope derived from that membership on the next request, although historical leadership assignments remain stored.

Repeating the same end operation is idempotent. A conflicting attempt to rewrite an already ended period returns `CONFLICT`.

---

## 8.7 Assign Department Leader

```http
POST /departments/:departmentId/leaders
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "memberId": "ce686f62-3e76-4f41-aef2-c9d376a52906",
  "title": "Media Head",
  "startsAt": "2026-07-22",
  "endsAt": null
}
```

### Transaction

The backend shall validate that the member and department belong to the same church, the member has a membership period covering the proposed leadership start, the leadership term does not extend beyond a scheduled membership end, the date range is valid, and no unrevoked assignment overlaps the proposed term. It shall create the leadership assignment, ensure the related user holds `DEPARTMENT_LEADER`, and create an audit log atomically.

The global role does not grant access until the assignment becomes active.

---

## 8.8 Revoke Department Leader Assignment

```http
POST /departments/:departmentId/leaders/:assignmentId/revoke
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "reason": "Leadership responsibility reassigned."
}
```

The reason must contain meaningful non-whitespace text. The backend shall lock and validate the assignment, record `revokedAt`, `revokedBy`, and `revocationReason` using server values, and create an audit log. The operation is idempotent and takes effect on the next authorization check. Historical assignment data must remain intact.

The `DEPARTMENT_LEADER` role may remain assigned because the member may lead another department; role presence never bypasses assignment scope.

---

## 8.9 Get My Led Departments

```http
GET /departments/my-leadership
```

**Roles:** `DEPARTMENT_LEADER`

Returns only unrevoked assignments active on the current date in the church timezone. Future, expired, and revoked assignments are excluded from active scope.

---

# 9. Event API

## 9.1 List Events

```http
GET /events
```

**Access:** Active authenticated users

### Query Parameters

```text
status=SCHEDULED
from=2026-07-01
to=2026-07-31
departmentId=<uuid>
page=1
limit=20
```

---

## 9.2 Get Active Events

```http
GET /events/active
```

**Access:** Active authenticated users

The response should include only events for which the member is eligible.

---

## 9.3 Create Event

```http
POST /events
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "name": "Sunday Youth Service",
  "eventType": "YOUTH_SERVICE",
  "description": "Weekly youth service.",
  "startsAt": "2026-07-26T08:00:00.000Z",
  "endsAt": "2026-07-26T11:00:00.000Z",
  "attendanceOpensAt": "2026-07-26T07:15:00.000Z",
  "attendanceClosesAt": "2026-07-26T08:45:00.000Z",
  "earlyUntil": "2026-07-26T07:45:00.000Z",
  "lateAfter": "2026-07-26T08:00:00.000Z",
  "locationName": "Arrows Church Auditorium",
  "latitude": 5.6037,
  "longitude": -0.187,
  "geofenceRadiusMeters": 100,
  "maximumAccuracyMeters": 50,
  "requiredDepartmentIds": []
}
```

---

## 9.4 Get Event

```http
GET /events/:eventId
```

**Access:** Active authenticated users

---

## 9.5 Update Event

```http
PATCH /events/:eventId
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

This endpoint must not set `CANCELLED` or `COMPLETED` directly. Cancellation and attendance finalization use their dedicated transactional endpoints.

---

## 9.6 Cancel Event

```http
POST /events/:eventId/cancel
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "reason": "Service rescheduled."
}
```

The reason is required, must contain meaningful non-whitespace text, and must not exceed 1,000 characters.

### Transaction

The backend shall:

1. Lock the event and authorize the administrator.
2. Allow cancellation only from `DRAFT`, `SCHEDULED`, or `ACTIVE`.
3. Reject a finalized or `COMPLETED` event with `EVENT_NOT_CANCELLABLE`.
4. Set `status` to `CANCELLED` and record `cancelledAt`, `cancelledBy`, and `cancellationReason` using server values.
5. Preserve existing attendance records but set their `pointsAwarded` to zero.
6. Void related secondary point-ledger entries with actor, server timestamp, and reason.
7. Change pending and approved event-specific absence requests to `CANCELLED`, recording the cancelling administrator, server timestamp, and a system review note.
8. Leave date-range absence requests unchanged.
9. Create an audit log containing affected-record counts but no sensitive absence details.

Cancellation prevents subsequent check-in, manual attendance, correction, and finalization for the event. Cancelled-event attendance remains available only to authorized administrative audit/report views and never contributes to rates, streaks, points, or rankings.

### Response

```json
{
  "success": true,
  "message": "Event cancelled successfully.",
  "data": {
    "eventId": "2fd92f13-e52b-4afa-9c60-5d477f59e685",
    "status": "CANCELLED",
    "cancelledAt": "2026-07-26T07:30:00.000Z",
    "cancelledBy": "a65d7e4f-9dd6-40b5-8c83-431bd84f9f57",
    "cancellationReason": "Service rescheduled.",
    "preservedAttendanceRecords": 12,
    "voidedPointEntries": 12,
    "cancelledAbsenceRequests": 3,
    "alreadyCancelled": false
  }
}
```

Repeating cancellation for an already cancelled event is idempotent: return the original metadata and `alreadyCancelled: true` without rewriting the reason or downstream records.

---

## 9.7 Finalize Event Attendance

```http
POST /events/:eventId/finalize-attendance
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

The same application service may be invoked automatically after the attendance window closes. The operation is idempotent, rejects events whose attendance window remains open, and never finalizes draft or cancelled events. Repeating it for an already finalized event returns the stored outcome summary without changing attendance.

### Transaction

The backend shall:

1. Lock or claim the event finalization operation.
2. Resolve every member whose membership period contains the event start date in the church timezone and who otherwise satisfies event eligibility.
3. Preserve existing valid geolocation and manual attendance.
4. Match approved event-specific or date-range absence requests.
5. Create or update `EXCUSED` system records with `absenceRequestId`.
6. Create `ABSENT` system records for remaining eligible members without outcomes.
7. Set `attendanceFinalizedAt`, record the administrator in `attendanceFinalizedBy` or leave it null for scheduled finalization, and mark the event `COMPLETED` when appropriate.
8. Record audit metadata.

Concurrent finalization and check-in must never overwrite a valid check-in. The `(event_id, member_id)` unique constraint and conflict-aware upserts enforce one outcome per member.

### Response

```json
{
  "success": true,
  "message": "Event attendance finalized successfully.",
  "data": {
    "eventId": "2fd92f13-e52b-4afa-9c60-5d477f59e685",
    "preservedAttendances": 34,
    "excusedRecords": 3,
    "absentRecords": 5,
    "alreadyFinalized": false
  }
}
```

---

# 10. Attendance API

## 10.1 Check In

```http
POST /attendance/check-in
```

**Roles:** Active member accounts

### Request

```json
{
  "eventId": "2fd92f13-e52b-4afa-9c60-5d477f59e685",
  "latitude": 5.6037,
  "longitude": -0.187,
  "accuracyMeters": 18.5
}
```

### Backend Validation Order

1. Authenticate user.
2. Verify account is `ACTIVE`.
3. Verify member profile exists.
4. Verify event exists.
5. Verify event attendance window is open.
6. Verify member is eligible.
7. Validate latitude, longitude, and accuracy.
8. Calculate distance server-side.
9. Verify user is within the geofence.
10. Prevent duplicate attendance.
11. Determine attendance status using server time.
12. Create attendance record.
13. Create leaderboard entries where required.

### Success Response

```json
{
  "success": true,
  "message": "Attendance recorded successfully.",
  "data": {
    "attendanceId": "7ad8018c-84af-48b7-a4ec-33170b1536cb",
    "eventId": "2fd92f13-e52b-4afa-9c60-5d477f59e685",
    "status": "ON_TIME",
    "checkedInAt": "2026-07-26T07:54:22.000Z",
    "distanceMeters": 23.4,
    "pointsAwarded": 10
  }
}
```

### Outside-Geofence Response

```json
{
  "success": false,
  "message": "You are outside the attendance area.",
  "error": {
    "code": "OUTSIDE_GEOFENCE",
    "details": {
      "distanceMeters": 187.2,
      "allowedRadiusMeters": 100
    }
  }
}
```

---

## 10.2 Get Own Attendance

```http
GET /attendance/me
```

**Roles:** Active members

### Query Parameters

```text
from=2026-01-01
to=2026-12-31
status=ON_TIME
page=1
limit=20
```

---

## 10.3 Get Event Attendance

```http
GET /attendance/events/:eventId
```

**Roles:** `SUPER_ADMIN`, `ADMIN`, `ATTENDANCE_OFFICER`, eligible `DEPARTMENT_LEADER`

Department leaders may access event attendance only for members and required departments within their active assignment scope. Open-to-all events are restricted to members of actively led departments.

---

## 10.4 Manual Attendance

```http
POST /attendance/manual
```

**Roles:** `SUPER_ADMIN`, `ADMIN`, `ATTENDANCE_OFFICER`

### Request

```json
{
  "eventId": "2fd92f13-e52b-4afa-9c60-5d477f59e685",
  "memberId": "ce686f62-3e76-4f41-aef2-c9d376a52906",
  "status": "MANUAL",
  "punctualityStatus": null,
  "reason": "Member's phone battery was unavailable."
}
```

`punctualityStatus` may be `EARLY`, `ON_TIME`, `LATE`, or `null`. It must remain `null` unless the authorized actor can verify the member's arrival category. Valid manual attendance counts toward attendance even when its punctuality is unknown.

An audit log entry is required.

If finalization already created a system `ABSENT` or `EXCUSED` outcome, authorized manual attendance may replace that generated outcome transactionally, clear `absenceRequestId`, award the standard attendance points, and create an audit log. It must not overwrite existing geolocation or manual attendance; those changes require the correction endpoint.

---

## 10.5 Correct Attendance

```http
PATCH /attendance/:attendanceId
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Request

```json
{
  "status": "EXCUSED",
  "punctualityStatus": null,
  "reviewNote": "Approved ministry assignment at another venue."
}
```

Leaderboard points must be adjusted transactionally.

---

# 11. Absence Request API

## 11.1 Submit Absence Request

```http
POST /absence-requests
```

**Roles:** Active members

### Event-Specific Request

```json
{
  "eventId": "2fd92f13-e52b-4afa-9c60-5d477f59e685",
  "reason": "WORK",
  "details": "Assigned to a work shift."
}
```

### Date-Range Request

```json
{
  "startsOn": "2026-08-01",
  "endsOn": "2026-08-15",
  "reason": "TRAVEL",
  "details": "Travelling outside Accra."
}
```

The request must use exactly one mode: `eventId`, or a complete `startsOn` and `endsOn` range. Combining the modes, supplying a partial range, or using an end date before the start date returns `VALIDATION_ERROR`.

Date ranges are matched against the event start date in the configured church IANA timezone.

---

## 11.2 List Own Requests

```http
GET /absence-requests/me
```

**Roles:** Active members

---

## 11.3 Review Absence Request

```http
PATCH /absence-requests/:requestId/review
```

**Roles:** `SUPER_ADMIN`, `ADMIN`, assigned `DEPARTMENT_LEADER`

The backend must resolve department-leader scope for every review:

- Event-specific requests require an actively led department that contains the member and makes the member eligible for the event.
- Open-to-all events and date-range requests require active leadership of the member's primary department.
- If the member has no primary department, open-to-all event and date-range requests require `SUPER_ADMIN` or `ADMIN` review.
- Role presence without an active assignment returns `DEPARTMENT_SCOPE_FORBIDDEN`.
- A scoped absence-request lookup returns `NOT_FOUND` when the request is missing or outside the leader's scope.

### Request

```json
{
  "status": "APPROVED",
  "reviewNote": "Approved."
}
```

### Approval Transaction

When `status` is `APPROVED`, the backend shall:

1. Lock and validate the pending absence request.
2. Resolve eligible covered events whose attendance windows have closed; defer open and future events to finalization.
3. For an event-specific request, reject approval with `ATTENDANCE_CONFLICT` when that event already has protected `EARLY`, `ON_TIME`, `LATE`, or valid manual attendance.
4. For a date-range request, preserve and skip covered events that already have protected attendance.
5. Create an `EXCUSED` system record when no attendance record exists.
6. Change existing `ABSENT`, `INVALID`, or `PENDING_REVIEW` outcomes to `EXCUSED`.
7. Set `absenceRequestId`, clear attendance points, and preserve an audit trail.
8. Mark the absence request approved with reviewer and server timestamps.

Open and future eligible events covered by an approved request are materialized as `EXCUSED` only during event finalization. Approval must not pre-create an outcome that could block a later valid check-in. Overlapping approved requests must not create duplicate attendance records. The response should report affected, deferred, and skipped-attended event counts for date-range approvals.

---

# 12. Leaderboard API

## 12.1 Individual Leaderboard

```http
GET /leaderboards/individual
```

**Access:** Active authenticated users

### Query Parameters

```text
period=MONTHLY
date=2026-07-01
departmentId=<uuid>
limit=50
```

The default period is `MONTHLY`. Supported periods are `WEEKLY`, `MONTHLY`, `QUARTERLY`, and `YEARLY`.

### Response Example

```json
{
  "success": true,
  "message": "Individual leaderboard retrieved successfully.",
  "data": {
    "period": "MONTHLY",
    "startsOn": "2026-07-01",
    "endsOn": "2026-07-31",
    "minimumQualifyingEvents": 3,
    "items": [
      {
        "rank": 1,
        "memberId": "ce686f62-3e76-4f41-aef2-c9d376a52906",
        "displayName": "Bismark M.",
        "expectedEvents": 9,
        "attendedEvents": 8,
        "attendanceRate": 88.89,
        "knownPunctualityAttendances": 8,
        "punctualAttendances": 7,
        "punctualityRate": 87.5,
        "score": 88.47,
        "qualified": true,
        "currentAttendanceStreak": 4,
        "longestAttendanceStreak": 7,
        "secondaryPoints": 72
      }
    ]
  }
}
```

Members with fewer than three expected events may be returned with `qualified: false` and `rank: null`, but they must not displace qualified members.

Member-visible results should use a privacy-conscious display name such as first name and surname initial. Detailed identity and attendance information remains restricted by role.

---

## 12.2 Department Leaderboard

```http
GET /leaderboards/departments
```

**Access:** Active authenticated users

### Query Parameters

```text
period=MONTHLY
date=2026-07-01
```

### Response Example

```json
{
  "success": true,
  "message": "Department leaderboard retrieved successfully.",
  "data": {
    "period": "MONTHLY",
    "items": [
      {
        "rank": 1,
        "departmentId": "4aefc243-f9be-4bd0-b420-752eb9ec04d5",
        "departmentName": "Media",
        "applicableEvents": 4,
        "expectedAttendanceSlots": 40,
        "attendedSlots": 38,
        "attendanceRate": 95.4,
        "punctualityRate": 91.2,
        "score": 94.14,
        "qualified": true
      }
    ]
  }
}
```

Department metrics must be calculated from expected member-event attendance slots. They must not use raw attendance totals or an average of individual member scores.

## 12.3 Leaderboard Calculation Rules

```text
Attendance Rate =
Attended Eligible Events / Expected Eligible Events * 100

Punctuality Rate =
Early and On-Time Attendances / Attendances with Known Punctuality * 100

Official Score =
(Attendance Rate * 0.70) + (Punctuality Rate * 0.30)
```

When `knownPunctualityAttendances` is zero, `punctualityRate` is `null` and the official score equals the attendance rate. Unknown manual-attendance punctuality must not be treated as zero.

Calculation rules:

- `EARLY`, `ON_TIME`, `LATE`, and valid manual attendance count as attended.
- `ABSENT` and `INVALID` do not count as attended.
- `EXCUSED`, `PENDING_REVIEW`, cancelled events, and ineligible events are excluded from denominators.
- Manual attendance without a verified `punctualityStatus` is excluded only from the punctuality denominator.
- At least three expected or applicable events are required for a numbered rank.
- Individual ties are resolved by punctuality rate, then attendance rate, then display name.
- Department ties are resolved by punctuality rate, then attendance rate, then department name.
- Streaks and secondary points do not alter the official score.
- Each valid attendance awards 10 secondary points; all other outcomes award zero.
- Approved absences pause streaks; actual absences break streaks.
- The service calculates results from retained source records; changing periods does not reset or delete history.
- When church settings disable leaderboards, leaderboard endpoints return `403 LEADERBOARDS_DISABLED`; members may still access their own attendance statistics.

---

# 13. Report API

## 13.1 Attendance Summary

```http
GET /reports/attendance-summary
```

**Roles:** `SUPER_ADMIN`, `ADMIN`, restricted `DEPARTMENT_LEADER`

Department leaders must supply or be constrained to an actively led `departmentId`. They cannot retrieve church-wide report aggregates.

### Query Parameters

```text
from=2026-07-01
to=2026-07-31
departmentId=<uuid>
eventType=YOUTH_SERVICE
includeCancelled=false
```

`includeCancelled` defaults to `false`. Only authorized administrative report views may set it to `true`; preserved attendance must then be marked non-scoring.

---

## 13.2 Repeated Absences

```http
GET /reports/repeated-absences
```

**Roles:** `SUPER_ADMIN`, `ADMIN`, restricted `DEPARTMENT_LEADER`

Department leaders are constrained to actively led departments and cannot retrieve church-wide repeated-absence results.

### Query Parameters

```text
minimumConsecutiveAbsences=3
departmentId=<uuid>
```

---

## 13.3 Export Attendance CSV

```http
GET /reports/attendance/export
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

### Query Parameters

```text
format=csv
from=2026-07-01
to=2026-07-31
departmentId=<uuid>
```

Response:

```http
Content-Type: text/csv
Content-Disposition: attachment; filename="attendance-2026-07.csv"
```

---

# 14. Audit Log API

## 14.1 List Audit Logs

```http
GET /audit-logs
```

**Roles:** `SUPER_ADMIN`

### Query Parameters

```text
actorUserId=<uuid>
action=ACCOUNT_APPROVED
entityType=USER
from=2026-07-01
to=2026-07-31
page=1
limit=50
```

---

## 14.2 Get Audit Log

```http
GET /audit-logs/:auditLogId
```

**Roles:** `SUPER_ADMIN`

Sensitive values must be redacted.

---

# 15. Church Settings API

## 15.1 Get Church Settings

```http
GET /church/settings
```

**Roles:** `SUPER_ADMIN`, `ADMIN`

---

## 15.2 Update Church Settings

```http
PATCH /church/settings
```

**Roles:** `SUPER_ADMIN`

### Request

```json
{
  "name": "Arrows Church",
  "address": "Accra, Ghana",
  "timezone": "Africa/Accra",
  "latitude": 5.6037,
  "longitude": -0.187,
  "geofenceRadiusMeters": 100,
  "leaderboardsEnabled": true
}
```

An audit log entry is required.

---

# 16. Authorization Matrix

| Endpoint Group | Member | Department Leader | Attendance Officer | Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Register/login | Yes | Yes | Yes | Yes | Yes |
| View own profile | Yes | Yes | Yes | Yes | Yes |
| Check in | Yes | Yes | Yes | Yes | Yes |
| View own attendance | Yes | Yes | Yes | Yes | Yes |
| Review pending users | No | No | No | Yes | Yes |
| Manage members | No | Limited | No | Yes | Yes |
| View assigned department data | No | Assigned only | No | Yes | Yes |
| Assign or end department memberships | No | No | No | Yes | Yes |
| Create events | No | No | No | Yes | Yes |
| Manual attendance | No | No | Yes | Yes | Yes |
| Correct attendance | No | No | No | Yes | Yes |
| Review absence requests | No | Assigned only | No | Yes | Yes |
| View church-wide reports | No | No | No | Yes | Yes |
| View audit logs | No | No | No | No | Yes |
| Update church settings | No | No | No | No | Yes |

`Assigned only` always requires both the `DEPARTMENT_LEADER` role and an active, unrevoked `department_leaders` record. Scope must be checked against the requested resource on every backend request.

---

# 17. Validation Rules

## Registration

- First name: 2–100 characters
- Last name: 2–100 characters
- Email: valid normalized email
- Phone: normalized international number
- Password: minimum configured strength
- Requested department: valid active department when provided

## Coordinates

- Latitude: `-90` to `90`
- Longitude: `-180` to `180`
- Accuracy: greater than `0`
- Geofence radius: greater than `0`

## Event Dates

- Event end must be after event start
- Attendance close must be after attendance open
- Late threshold must fall within the attendance window
- Early threshold must not occur after the late threshold

## Pagination

- Default page: `1`
- Default limit: `20`
- Maximum limit: `100`

---

# 18. Idempotency and Concurrency

## Attendance

The database must enforce:

```text
UNIQUE (event_id, member_id)
```

Concurrent duplicate check-in requests should return:

```text
409 DUPLICATE_ATTENDANCE
```

## Account Approval

Approval endpoints must reject accounts that are no longer pending.

## Refresh Tokens

Refresh token rotation must invalidate the previous token atomically.

## Account Action Tokens

Email-verification and password-reset confirmation shall lock the matching token row during consumption. Concurrent submissions for the same token must result in at most one success.

## Event Finalization

Finalization shall be safely repeatable. Concurrent finalization requests, and a finalization racing with the final valid check-in, must result in one correct member-event outcome without lost attendance.

## Event Cancellation

Cancellation shall lock the event row and update the event, attendance points, point-ledger entries, event-specific absence requests, and audit log in one transaction. Concurrent cancellation requests must produce one cancellation result. Cancellation racing with finalization must allow only one valid terminal transition.

---

# 19. Rate Limiting

Recommended limits:

| Endpoint | Suggested Limit |
|---|---|
| Login | 5 attempts per 15 minutes |
| Registration | 5 attempts per hour per IP |
| Password reset | 3 attempts per hour |
| Email verification resend | 3 attempts per hour |
| Account-action token confirmation | 10 attempts per 15 minutes per IP |
| Refresh token | 30 requests per 15 minutes |
| Attendance check-in | 10 requests per 5 minutes |
| General API | 100 requests per minute |

Final limits may be adjusted after testing.

---

# 20. Swagger/OpenAPI

The NestJS backend shall expose interactive API documentation.

Development example:

```text
http://localhost:4000/docs
```

The Swagger specification should include:

- Endpoint descriptions
- DTO schemas
- Authentication requirements
- Role requirements
- Query parameters
- Response examples
- Error responses

Production Swagger access may be restricted.

---

# 21. API Versioning

The first API version shall use:

```text
/api/v1
```

Breaking changes shall require a new major version.

Non-breaking fields may be added without creating a new API version.

---

# 22. Open API Decisions

- Whether access tokens use headers or secure cookies.
- Whether pending users receive limited access tokens.
- Whether phone number is required.
- Whether attendance officers can correct existing records.
- Whether location coordinates are retained indefinitely or removed after a configured period.
- Whether event recurrence is handled by recurring rules or generated event instances.

---

# 23. Next Deliverables

The next planning documents should be:

```text
docs/ARCHITECTURE.md
docs/ROADMAP.md
```

After those documents, implementation can begin with:

1. NestJS project initialization
2. PostgreSQL and Docker setup
3. Drizzle configuration
4. Authentication module
5. Account approval workflow
