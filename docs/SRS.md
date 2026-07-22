# Software Requirements Specification (SRS)

## Arrows Church Management System (ACMS)

**Version:** 1.0  
**Status:** Draft  
**Project Phase:** Planning and Design

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the functional and non-functional requirements for the Arrows Church Management System (ACMS).

The system will help Arrows Youth Ministry manage members, departments, church events, attendance, account approvals, leaderboards, and reports through a secure mobile-first web application.

### 1.2 Scope

The first release will support one church organization: Arrows Church.

Users may create accounts publicly, but all newly registered accounts must be approved by an administrator before gaining access to protected features.

Attendance will be recorded primarily through browser-based geolocation and server-side geofence verification.

### 1.3 Objectives

The system shall:

- Replace manual attendance records.
- Manage members and departments.
- Allow users to register and await administrator approval.
- Support secure role-based access control.
- Record attendance using geolocation.
- Track punctuality and attendance history.
- Rank individuals and departments fairly.
- Generate attendance and departmental reports.
- Preserve audit records for important administrative actions.

---

## 2. Product Overview

### 2.1 Product Perspective

ACMS is a standalone church management platform consisting of:

- A Next.js web application.
- A NestJS REST API.
- A PostgreSQL database.
- A role-based authentication and authorization system.
- A geolocation-based attendance module.
- An administration dashboard.
- Member and department dashboards.

### 2.2 Initial Deployment Scope

The first version shall support:

- One church.
- One primary church location.
- Multiple ministries and departments.
- Multiple user roles.
- Public member registration.
- Administrator approval.
- Location-based attendance.
- Individual and departmental reporting.

Public church registration, subscriptions, billing, and multi-tenant church workspaces are excluded from the first release.

---

## 3. User Roles

### 3.1 Super Administrator

The Super Administrator shall be able to:

- Manage all system modules.
- Create and manage administrators.
- Configure church details.
- Configure geofence settings.
- Approve, reject, suspend, or reactivate users.
- View and export all reports.
- View audit logs.

### 3.2 Administrator

The Administrator shall be able to:

- Review pending registrations.
- Approve or reject users.
- Assign roles and departments.
- Manage members.
- Manage departments.
- Create and manage events.
- Correct attendance records.
- View reports and leaderboards.

### 3.3 Department Leader

The Department Leader shall be able to:

- View members in assigned departments.
- View department attendance.
- Review department absence requests.
- View department reports.
- View department leaderboard performance.
- Submit attendance exceptions for review.

### 3.4 Attendance Officer

The Attendance Officer shall be able to:

- View active attendance events.
- Record manual attendance.
- Verify attendance exceptions.
- Add reasons for manual attendance actions.

### 3.5 Member

The Member shall be able to:

- Register an account.
- Log in after approval.
- View their profile.
- View active events.
- Submit a location-based check-in.
- View attendance history.
- View leaderboards.
- Submit absence requests.

### 3.6 Pending User

A pending user shall be able to:

- Log in.
- View account approval status.
- Update limited registration information.
- Log out.

A pending user shall not be able to:

- Check in.
- View attendance records.
- View departments.
- View leaderboards.
- View member-only events.
- Access administrative features.

---

## 4. Account Statuses

The system shall support the following account statuses:

- `PENDING_APPROVAL`
- `ACTIVE`
- `REJECTED`
- `SUSPENDED`

### 4.1 Registration Rules

- Public account registration shall be available.
- Every new account shall start as `PENDING_APPROVAL`.
- Every new account shall verify its email address before administrator approval.
- Registration shall not automatically assign a trusted role.
- A requested department shall be treated as a preference only.
- An administrator shall confirm the final department and role.
- Approved users shall become `ACTIVE`.
- Rejected users shall become `REJECTED`.
- Suspended users shall lose protected access without losing historical records.

### 4.2 Approval Records

Every approval or rejection shall record:

- Acting administrator.
- Date and time.
- Previous status.
- New status.
- Optional reason or administrative note.

---

## 5. Functional Requirements

### 5.1 Authentication

The system shall:

- Allow public registration.
- Require unique email addresses.
- Support unique phone numbers where phone numbers are collected.
- Hash passwords securely.
- Require email verification before administrator approval.
- Send email-verification links without exposing token values in logs or persistent storage.
- Allow approved users to log in.
- Prevent rejected and suspended users from accessing protected modules.
- Support access token renewal.
- Support secure logout.
- Support password reset.
- Store only hashes of password-reset and email-verification tokens.
- Make account-action tokens expiring, single-use, and revocable.
- Return generic responses when account-action requests could reveal whether an account exists.
- Revoke all existing refresh-token sessions after a successful password reset.
- Expire compromised or revoked sessions.

### 5.2 Member Management

The system shall:

- Create a member profile after approval.
- Store member contact information.
- Store membership status.
- Assign one or more departments.
- Assign one primary department.
- Assign leadership responsibilities.
- Allow administrators to activate, suspend, or archive members.
- Preserve historical attendance when a member becomes inactive.

### 5.3 Department Management

The system shall:

- Allow administrators to create departments.
- Allow departments to have descriptions.
- Assign one or more department leaders.
- Add and remove department members.
- Prevent duplicate department membership records.
- Track current and historical membership where required.
- Generate department-specific attendance reports.

Example departments include Media, Ushers, Sound Engineering, Protocol, Leadership, Prayer, Welfare, and Music.

### 5.4 Event Management

The system shall allow administrators to create events with:

- Event name.
- Event type.
- Date.
- Start time.
- End time.
- Attendance opening time.
- Attendance closing time.
- Late threshold.
- Location.
- Latitude.
- Longitude.
- Geofence radius.
- Required departments.
- Event status.
- Optional notes.

The system shall support Sunday services, youth meetings, department meetings, rehearsals, training sessions, outreach events, and special programmes.

### 5.5 Active Event Detection

The system shall:

- Identify events whose attendance window is currently open.
- Display the active event to eligible members.
- Prevent check-in when no eligible event is active.
- Handle overlapping events according to department eligibility.
- Allow the user to select an event when more than one eligible event is active.

### 5.6 Location Permission

The web application shall:

- Request location permission only when required for attendance.
- Explain why location access is required.
- Handle granted permission.
- Handle denied permission.
- Handle unavailable location.
- Handle request timeout.
- Display retry instructions when verification fails.

### 5.7 Geofence Verification

For every location-based check-in, the backend shall verify:

- The user is authenticated.
- The account status is `ACTIVE`.
- The event exists.
- The attendance window is open.
- The member is eligible for the event.
- Latitude and longitude are valid.
- Location accuracy is within the accepted limit.
- The calculated distance is within the event geofence radius.
- No attendance record already exists for the same member and event.

The backend shall calculate distance using a server-side geographic distance calculation. The browser shall not make the final attendance decision.

### 5.8 Attendance Status

The system shall support:

- `EARLY`
- `ON_TIME`
- `LATE`
- `ABSENT`
- `EXCUSED`
- `MANUAL`
- `PENDING_REVIEW`
- `INVALID`

The system shall determine attendance status using server time and event configuration.

### 5.9 Attendance Records

Each attendance record shall include:

- Member.
- Event.
- Check-in time.
- Attendance status.
- Attendance method.
- Submitted latitude.
- Submitted longitude.
- Reported GPS accuracy.
- Calculated distance.
- Geofence result.
- Points awarded.
- Created date.
- Updated date.
- Manual actor where applicable.
- Manual reason where applicable.

The system shall enforce one attendance record per member per event.

### 5.10 Manual Attendance

Authorized users shall be able to record manual attendance when a member has no compatible device, internet access fails, GPS fails, the member's device is unavailable, or an approved exception applies.

Manual attendance shall require:

- An authorized actor.
- A reason.
- A timestamp.
- An audit log entry.

### 5.11 Absence Requests

Members shall be able to submit absence requests containing:

- Event or date range.
- Reason.
- Optional note.
- Submission timestamp.

Department leaders or administrators shall be able to approve, reject, request clarification, and add an administrative note.

Approved absences shall not unfairly reduce leaderboard scores.

### 5.12 Individual Leaderboard

The system shall:

- Rank eligible active members.
- Use an official percentage score calculated as 70% attendance rate and 30% punctuality rate.
- Calculate attendance rate as attended eligible events divided by expected eligible events.
- Calculate punctuality rate as early and on-time attendances divided by attendances with a known punctuality result.
- Require at least three expected events in the selected period before assigning a numbered rank.
- Support weekly, monthly, quarterly, and yearly periods.
- Use the monthly period as the default leaderboard view.
- Display current and longest attendance and punctuality streaks separately from the official score.
- Treat approved absences as neutral: they shall not reduce the score or break a streak.
- Exclude cancelled events, ineligible events, and events before the member joined from score denominators.
- Treat unresolved attendance reviews as neutral until they are resolved.
- Treat raw points as a secondary motivational value rather than the official ranking metric.
- Award 10 secondary points for each valid attendance and zero points for all other outcomes.
- Avoid negative points and oversized streak bonuses.
- Avoid ranking inactive or suspended accounts.
- Avoid publicly identifying the lowest-performing members.

### 5.13 Department Leaderboard

The system shall:

- Rank departments using an official score calculated as 70% attendance rate and 30% punctuality rate.
- Calculate rates from all expected member-event attendance slots for the department.
- Avoid using raw attendance totals or the average of member scores as the main ranking measure.
- Remove approved absences and other neutral attendance slots from the denominator.
- Require at least three applicable events in the selected period before assigning a numbered rank.
- Support weekly, monthly, quarterly, and yearly periods.
- Use punctuality rate, then attendance rate, then department name as deterministic tie-breakers.

### 5.13.1 Leaderboard Definitions

For a selected period:

```text
Attendance Rate =
Attended Eligible Events / Expected Eligible Events * 100

Punctuality Rate =
Early and On-Time Attendances / Attendances with Known Punctuality * 100

Official Score =
(Attendance Rate * 0.70) + (Punctuality Rate * 0.30)
```

When a qualifying member or department has no attendance with known punctuality in the selected period, the official score shall equal the attendance rate. This makes unknown manual-attendance punctuality neutral rather than treating it as zero.

Attendance outcomes shall be interpreted as follows:

- `EARLY`, `ON_TIME`, `LATE`, and valid manual attendance count as attended.
- `ABSENT` and `INVALID` do not count as attended.
- `EXCUSED`, `PENDING_REVIEW`, cancelled events, and ineligible events are excluded from the denominator.
- Manual attendance with no verified punctuality counts toward attendance but not toward the punctuality denominator.

Leaderboard history shall be retained. Changing the selected period shall not delete or reset attendance or point records.

Administrators shall be able to disable member-visible leaderboards. Members shall retain access to their own attendance statistics when public leaderboards are disabled.

### 5.14 Reports

The system shall provide:

- Attendance by event.
- Attendance by member.
- Attendance by department.
- Punctuality reports.
- Absence reports.
- Repeated absence reports.
- Monthly summaries.
- Department comparison reports.
- Manual attendance reports.
- Account approval reports.

The system shall support CSV export in the MVP. PDF and Excel export may be added later.

### 5.15 Dashboards

#### Member Dashboard

The member dashboard shall display account status, active event, check-in status, attendance percentage, attendance streak, recent attendance, individual rank, and department rank.

#### Administrator Dashboard

The administrator dashboard shall display total active members, pending approvals, active events, present members, late members, absent members, attendance rate, department comparison, and recent attendance activity.

#### Department Leader Dashboard

The department leader dashboard shall display department members, current event attendance, department attendance rate, missing members, pending absence requests, and department ranking.

### 5.16 Audit Logging

The system shall record audit logs for:

- User approval.
- User rejection.
- User suspension.
- Role changes.
- Department assignment changes.
- Event creation and updates.
- Attendance corrections.
- Manual attendance.
- Configuration changes.

Audit logs shall include actor, action, target entity, previous value where appropriate, new value where appropriate, timestamp, and optional IP address and device information.

---

## 6. Business Rules

### 6.1 Church Scope

- Version 1 shall operate for Arrows Church only.
- Users shall register as members, not as church owners.
- Public church registration shall not be available.
- The data model may include a church identifier to support future expansion.

### 6.2 Attendance Rules

- Only active approved users may check in.
- Check-in shall only occur during an event attendance window.
- Duplicate check-ins shall be rejected.
- Server time shall determine punctuality.
- Location accuracy above the configured threshold may be rejected.
- A user outside the geofence shall not be marked present automatically.
- Manual attendance shall require authorization and a reason.

### 6.3 Department Rules

- A member may belong to multiple departments.
- A member shall have at most one primary department.
- Department requests made during registration require administrator confirmation.
- Department leaders shall only manage assigned departments.

### 6.4 Data Retention Rules

- Attendance history shall remain after account suspension.
- Rejected registration records may be retained for audit purposes.
- Important records shall not be permanently deleted without authorized administrative action.

---

## 7. Non-Functional Requirements

### 7.1 Security

The system shall:

- Use HTTPS in production.
- Hash passwords using a secure password hashing algorithm.
- Protect tokens using secure cookie practices where applicable.
- Validate all incoming data.
- Enforce authorization on the backend.
- Rate-limit sensitive endpoints.
- Prevent secrets from being committed to version control.
- Record security-sensitive administrative actions.
- Protect against common web vulnerabilities.

### 7.2 Performance

- Common dashboard pages should load within three seconds under normal network conditions.
- Check-in processing should complete within five seconds under normal conditions.
- Reports should load within ten seconds for expected church data volumes.

### 7.3 Reliability

- Duplicate attendance shall be prevented at the database level.
- Attendance operations shall use transactions where necessary.
- Failed check-ins shall return clear errors.
- Production data shall be backed up regularly.

### 7.4 Accessibility

The application shall:

- Support keyboard navigation.
- Use readable contrast.
- Provide meaningful labels.
- Display clear permission and error messages.
- Avoid relying only on color to communicate status.

### 7.5 Responsiveness

The system shall be mobile-first and support Android mobile browsers, iPhone Safari, tablets, and desktop browsers.

### 7.6 Maintainability

The codebase shall:

- Use TypeScript strict mode.
- Separate frontend and backend responsibilities.
- Keep business logic outside controllers.
- Use migrations for database changes.
- Include automated tests for critical business rules.
- Maintain project documentation in the `docs/` directory.

### 7.7 Privacy

The system shall:

- Request location only when required.
- Avoid continuous location tracking.
- Store only attendance-related location evidence.
- Restrict sensitive data by role.
- Avoid exposing member information publicly.

---

## 8. External Interfaces

### 8.1 Web Interface

The system shall provide:

- Public registration page.
- Login page.
- Approval status page.
- Member dashboard.
- Administrator dashboard.
- Department dashboard.
- Attendance page.
- Leaderboard page.
- Reports page.

### 8.2 REST API

The backend shall expose a versioned REST API using the prefix:

```text
/api/v1
```

### 8.3 Browser APIs

The system shall use the Browser Geolocation API, browser storage only for non-sensitive client state where appropriate, and Progressive Web App capabilities where supported.

---

## 9. System Constraints

- The MVP shall support one church.
- The MVP shall use a web application rather than a native mobile application.
- Geolocation depends on device and browser support.
- Accurate location may be difficult indoors.
- Internet access is required for the initial MVP check-in workflow.
- SMS OTP and push notifications are not required for the first milestone.

---

## 10. Acceptance Criteria

The MVP shall be considered ready for internal testing when:

- Users can register successfully.
- New accounts remain pending.
- Registered users can verify their email with an expiring, single-use token.
- Administrators cannot approve an account before email verification.
- Administrators can approve or reject accounts.
- Approved users can log in.
- Pending, rejected, and suspended users cannot access protected features.
- Administrators can create departments.
- Administrators can create events with geofence settings.
- Active users can submit location-based check-ins.
- Outside-geofence check-ins are rejected.
- Duplicate check-ins are rejected.
- Attendance statuses are calculated correctly.
- Manual attendance is audited.
- Members can view attendance history.
- Individual and department leaderboards calculate correctly.
- Administrators can export attendance data as CSV.
- Critical authentication and attendance flows have automated tests.
- Password-reset completion revokes existing sessions and prevents token reuse.

---

## 11. Out of Scope for Version 1

- Public church registration.
- Multi-tenant SaaS workspaces.
- Subscription billing.
- Native Android application.
- Native iOS application.
- Facial recognition.
- Biometric attendance.
- Continuous location tracking.
- Full offline attendance synchronization.
- WhatsApp automation.
- Advanced AI analytics.
- Multiple independent churches.
- Device locking or browser fingerprinting.
- QR-code attendance verification.

---

## 12. Future Enhancements

- Multiple Arrows branches.
- Public church onboarding.
- Multi-tenant data isolation.
- Custom church branding.
- Push notifications.
- SMS OTP.
- Duty rosters.
- Training resources.
- Achievement badges.
- Check-out verification.
- Offline attendance synchronization.
- Advanced analytics.
- Native mobile applications.

---

## 13. Open Decisions

- Final church geofence radius.
- Maximum accepted GPS accuracy.
- Early attendance threshold.
- Late attendance threshold.
- Whether check-out is required.
- Whether rejected users may reapply.
- Whether attendance officers can correct existing records.
- Whether department leaders approve absence requests directly.
- How long precise attendance coordinates are retained.

---

## 14. Related Documentation

- `docs/PRD.md`
- `docs/ERD.md`
- `docs/API.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `AGENTS.md`
