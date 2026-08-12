# Development Roadmap

## Arrows Church Management System (ACMS)

**Version:** 1.0  
**Status:** Planned  
**Delivery Model:** Milestone-based  
**Architecture:** Next.js + NestJS + PostgreSQL + Drizzle ORM

---

## Launch-First Delivery Plan

This plan supersedes using every milestone below as a prerequisite for first
use. ACMS will be released in controlled phases so the church can begin using
the stable operational core while larger ministry features continue to be
developed.

### Current Implementation Snapshot — August 2026

Already implemented:

- Registration, email verification, approval, login, refresh, and logout
- Administrator dashboard, member directory, and account lifecycle
- Departments, memberships, primary departments, and department leaders
- Events, event eligibility, cancellation, and attendance windows
- Geofence and manual attendance, duplicate prevention, and finalization
- Absence requests and review
- Individual and department leaderboards
- Attendance reports, CSV export, and audit logs
- Member profile and cover photos through Cloudinary
- Member notification inbox and unread indicators
- Initial Publicity-to-Media flyer handoff and Media Hub
- Choir-to-Media ordered song lists with lyrics, keys, notes, and notifications
- Scoped pastor and department-leader dashboard messaging with recipient records
- Pastoral care queue for repeated absences and private follow-up records

Still requiring launch verification or implementation:

- Production environment and deployment pipeline
- Production database backup and restoration procedure
- End-to-end and real-device attendance testing
- Security, environment, and dependency review
- Monitoring, operational documentation, and user onboarding
- Leadership dashboard messages and SMS delivery
- Service liturgy, live timer, and projection view

---

### Phase 1 — Pilot-Ready Core

**Goal:** Use ACMS during real services with a small internal group as soon as
possible.

**Included:**

- Authentication and account approval
- Member and department management
- Event creation and attendance windows
- Automatic geofence attempt with manual check-in fallback
- Manual attendance correction by authorized leaders
- Member attendance history
- Basic absence requests
- Admin attendance reports and CSV export
- Profile and cover photos

**Work remaining before pilot:**

- [ ] Correct and verify production Cloudinary credentials.
- [ ] Test registration-to-approval end to end.
- [ ] Test automatic and button check-in on Android Chrome and iPhone Safari.
- [ ] Verify location-denied, weak-GPS, outside-geofence, and duplicate cases.
- [ ] Run access-control checks for admin, leader, and member accounts.
- [ ] Resolve critical lint, dependency, and security findings.
- [ ] Configure production PostgreSQL, migrations, secrets, HTTPS, and domains.
- [ ] Configure daily backups and perform one restoration test.
- [ ] Add application error and uptime monitoring.
- [ ] Create production administrator and church configuration.
- [ ] Onboard administrators and two department leaders.

**Release gate:** One administrator and a small group of members can complete a
real service check-in, correct exceptions, and export the attendance report
without developer intervention.

---

### Phase 2 — Controlled Church Rollout

**Goal:** Expand from the pilot group to all active members and department
leaders.

**Included:**

- Leaderboards and attendance streak presentation
- Full absence-review workflow
- Notification center
- Publicity-to-Media flyer handoff
- Department-leader access to their team
- Improved operational reports and audit review
- Repeated-absence pastoral follow-up queue

**Work remaining:**

- [ ] Complete flyer acknowledgement and completion states.
- [ ] Add Media Hub outstanding-work indicators.
- [ ] Add administrator controls for ministry workflow failures.
- [ ] Complete browser and responsive UI testing.
- [ ] Collect pilot feedback and correct high-priority usability issues.
- [ ] Document support, rollback, and incident procedures.

**Release gate:** All departments can use ACMS for two consecutive services
with no critical attendance or authorization failures.

---

### Phase 3 — Ministry Communication

**Goal:** Replace informal ministry handoffs and leader broadcast messages.

**Included:**

- Choir event song titles, ordering, lyrics, keys, and notes
- Leadership dashboard messages
- Pastor-to-church messages
- Leader-to-department messages
- SMS delivery queue, provider integration, delivery status, and retries

**Work remaining:**

- [x] Implement Choir-to-Media song-list API and interface.
- [x] Implement scoped leadership messaging permissions.
- [x] Implement dashboard message recipients and read state.
- [x] Select and integrate an SMS provider (Arkesel V2; credentials remain a deployment task).
- [x] Add background SMS jobs, delivery polling, retries, and delivery reporting.
- [x] Add messaging audit logs and cost protections.

**Release gate:** Pastors can reach the church and leaders can reach only their
authorized teams, with recipient and SMS delivery records available to admins.

---

### Phase 4 — Service Production and Projection

**Goal:** Help leaders and Media keep live services organized and on time.

**Included:**

- Reusable default liturgy templates
- Event schedules and preacher details/images
- Live start, pause, extend, skip, and complete controls
- Planned-versus-actual timing
- Media operator view
- Full-screen projection view

**Work remaining:**

- [x] Implement default liturgy templates and administration view.
- [x] Generate event liturgies from templates with preacher details and image.
- [x] Implement live timing state and audit history.
- [x] Implement operator and read-only projection interfaces.
- [x] Add reconnect and stale-state safeguards.
- [ ] Test on the church Media computer and projector.

**Release gate:** The Media team can run and project a complete service schedule
without relying on developer tools.

---

### Phase 5 — Scale and Optimization

**Goal:** Improve reliability, insight, and reach after stable church adoption.

Possible scope:

- Push notifications
- Installable PWA and enhanced offline behavior
- Advanced analytics
- Additional export formats
- Multi-church support
- Native mobile applications if usage justifies them

These items do not block the initial church launch.

---

## 1. Purpose

This roadmap converts the product requirements, system requirements, database design, API specification, and architecture into an implementation sequence.

The roadmap is intentionally structured to reduce rework. Each milestone should be completed and tested before the next dependent milestone begins.

---

## 2. Version 1 Scope

Version 1 includes:

- Public account registration
- Administrator approval
- Authentication and session management
- Role-based access control
- Member management
- Department management
- Event management
- Geofence-based attendance
- Manual attendance
- Absence requests
- Individual leaderboards
- Department leaderboards
- Attendance reports
- CSV export
- Audit logging
- Production deployment

Version 1 excludes:

- Multi-church registration
- Subscription billing
- Native mobile applications
- Push notifications
- SMS OTP
- Offline attendance synchronization
- Facial recognition
- Advanced AI analytics
- Microservices

---

# 3. Milestone Summary

| Milestone | Name                          | Main Outcome                                    |
| --------- | ----------------------------- | ----------------------------------------------- |
| M0        | Planning and Documentation    | Requirements and architecture approved          |
| M1        | Repository and Monorepo Setup | Frontend and backend workspace ready            |
| M2        | Local Infrastructure          | PostgreSQL and Docker running                   |
| M3        | Database Foundation           | Drizzle schema and migrations complete          |
| M4        | Backend Core                  | API foundation, validation, logging, and errors |
| M5        | Authentication                | Registration, login, refresh, logout            |
| M6        | Account Approval              | Admin approval and account lifecycle            |
| M7        | Members and Departments       | Core church workforce data                      |
| M8        | Events                        | Event scheduling and eligibility                |
| M9        | Attendance                    | Geofence and manual attendance                  |
| M10       | Absence Requests              | Excused absence workflow                        |
| M11       | Leaderboards                  | Individual and department ranking               |
| M12       | Reports                       | Analytics and CSV export                        |
| M13       | Frontend Application          | Complete member and admin interfaces            |
| M14       | Testing and Hardening         | Automated tests and security checks             |
| M15       | Deployment                    | Production release                              |

---

# 4. Milestone 0 — Planning and Documentation

## Status

Complete enough for implementation.

## Deliverables

- [x] `README.md`
- [x] `AGENTS.md`
- [x] `docs/PRD.md`
- [x] `docs/SRS.md`
- [x] `docs/ERD.md`
- [x] `docs/API.md`
- [x] `docs/ARCHITECTURE.md`
- [x] `docs/ROADMAP.md`
- [ ] `docs/database.dbml`

## Acceptance Criteria

- Version 1 scope is clear.
- User roles are documented.
- Database entities are documented.
- API endpoints are documented.
- System architecture is documented.
- Open decisions are identified.

---

# 5. Milestone 1 — Repository and Monorepo Setup

## Objective

Create a clean repository structure for the frontend, backend, documentation, and shared code.

## Tasks

### Repository

- [ ] Confirm repository name.
- [ ] Confirm default branch is `main`.
- [ ] Add `.gitignore`.
- [ ] Add `.editorconfig`.
- [ ] Add `.nvmrc` or define Node.js version.
- [ ] Add root `package.json`.
- [ ] Add workspace configuration.
- [ ] Add linting and formatting conventions.

### Structure

Create:

```text
apps/
├── web/
└── api/

packages/
└── shared/

docs/
```

### Frontend

- [ ] Move or create the Next.js application in `apps/web`.
- [ ] Confirm TypeScript strict mode.
- [ ] Confirm Tailwind CSS.
- [ ] Add shadcn/ui.
- [ ] Add TanStack Query.
- [ ] Add React Hook Form.
- [ ] Add Zod.

### Backend

- [ ] Create NestJS application in `apps/api`.
- [ ] Confirm TypeScript strict mode.
- [ ] Add environment configuration.
- [ ] Add health endpoint.

## Deliverables

- Functional monorepo
- Next.js app runs
- NestJS app runs
- Root scripts start both applications
- Documentation remains at repository root

## Acceptance Criteria

The following commands work:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
```

---

# 6. Milestone 2 — Local Infrastructure

## Objective

Create a reproducible local development environment.

## Tasks

### PostgreSQL

- [x] Add PostgreSQL to `docker-compose.yml`.
- [x] Create development database.
- [x] Add persistent Docker volume.
- [x] Add database health check.
- [x] Add `.env.example`.

### Environment Variables

Define:

```text
DATABASE_URL
API_PORT
WEB_URL
CORS_ORIGIN
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
ACCESS_TOKEN_TTL
REFRESH_TOKEN_TTL
```

### Developer Workflow

- [x] Add commands to start infrastructure.
- [x] Add commands to stop infrastructure.
- [x] Document database connection.
- [ ] Confirm the API connects to PostgreSQL.

## Deliverables

- `docker-compose.yml`
- `.env.example`
- PostgreSQL running locally
- API health endpoint verifies database connection

## Acceptance Criteria

```bash
docker compose up -d
```

starts PostgreSQL successfully, and:

```http
GET /health
```

returns a healthy database status.

---

# 7. Milestone 3 — Database Foundation

## Objective

Implement the Version 1 database schema using Drizzle ORM.

## Tasks

### Drizzle Setup

- [ ] Install Drizzle ORM.
- [ ] Install PostgreSQL driver.
- [ ] Configure Drizzle Kit.
- [ ] Add migration scripts.
- [ ] Add database connection module.

### Schema

Implement:

- [ ] Churches
- [ ] Users
- [ ] Member profiles
- [ ] Roles
- [ ] User roles
- [ ] Account reviews
- [ ] Departments
- [ ] Department members
- [ ] Department leaders
- [ ] Events
- [ ] Event departments
- [ ] Attendance records
- [ ] Absence requests
- [ ] Leaderboard entries
- [ ] Refresh tokens
- [ ] Audit logs

### Constraints

- [ ] Unique email
- [ ] Unique phone where present
- [ ] Unique user-role assignment
- [ ] Unique department membership
- [ ] Unique event-department assignment
- [ ] Unique attendance per event and member
- [ ] Valid event timing checks where practical
- [ ] Foreign-key constraints
- [ ] Required indexes

### Seeds

- [ ] Seed Arrows Church.
- [ ] Seed system roles.
- [ ] Seed initial Super Administrator.
- [ ] Seed sample departments for development only.

## Deliverables

- Drizzle schemas
- Initial migration
- Seed script
- `docs/database.dbml`

## Acceptance Criteria

A clean database can be created using migrations and populated with required seed data.

---

# 8. Milestone 4 — Backend Core

## Objective

Build shared backend infrastructure before implementing business modules.

## Tasks

### Application Configuration

- [ ] Environment validation.
- [ ] CORS configuration.
- [ ] Helmet security headers.
- [ ] Global validation pipe.
- [ ] API version prefix.
- [ ] Swagger/OpenAPI.

### Responses and Errors

- [ ] Standard success response.
- [ ] Standard error response.
- [ ] Global exception filter.
- [ ] Domain error codes.
- [ ] Validation error formatting.

### Logging

- [ ] Add Pino logging.
- [ ] Add request IDs.
- [ ] Redact sensitive values.
- [ ] Add structured request logging.

### Shared Infrastructure

- [ ] Pagination DTO.
- [ ] Authenticated-user decorator.
- [ ] Role decorator.
- [ ] Account-status guard.
- [ ] Role guard.
- [ ] Database transaction helper.
- [ ] Audit log service.

## Deliverables

- Stable API foundation
- Swagger documentation
- Consistent responses
- Logging and error handling

## Acceptance Criteria

All new modules can reuse the same validation, error, logging, and authorization infrastructure.

---

# 9. Milestone 5 — Authentication

## Objective

Implement secure registration and session management.

## Tasks

### Registration

- [x] Public registration endpoint.
- [x] Email normalization.
- [x] Phone normalization.
- [x] Password validation.
- [x] Argon2 password hashing.
- [x] Default `PENDING_APPROVAL` status.
- [x] Requested department validation.
- [x] Duplicate account handling.

### Email Verification

- [x] Local Mailpit email inbox.
- [x] Provider-independent email-delivery interface.
- [x] Send a 24-hour verification link after registration.
- [x] Generic verification-email request endpoint.
- [x] Revoke prior unused tokens when issuing a replacement.
- [x] Limit verification-token issuance to three per hour.
- [x] Atomically consume a single-use verification token.
- [x] Record `email_verified_at` using server time.
- [x] Browser verification and resend pages.
- [ ] Record the verification audit event.
- [ ] Configure Resend and the production sending domain.

### Login

- [x] Credential verification.
- [x] Account status handling.
- [x] Access token generation.
- [x] Refresh token generation.
- [x] Refresh token hashing.
- [x] Last-login tracking.
- [x] Failed-login tracking.
- [x] Temporary account lockout.

### Sessions

- [x] Token refresh.
- [x] Refresh-token rotation.
- [x] Logout.
- [x] Session revocation.
- [x] Current-user endpoint.

### Password Reset

- [x] Reset request.
- [x] Secure reset token.
- [x] Reset confirmation.
- [x] Invalidate old sessions after reset.

## Deliverables

- Complete authentication API
- Swagger documentation
- Unit and integration tests

## Acceptance Criteria

- A user can register.
- A pending user cannot access protected resources.
- An active user can log in.
- Tokens rotate correctly.
- Logout revokes the session.
- Passwords are never stored or logged in plain text.

---

# 10. Milestone 6 — Account Approval Workflow

## Objective

Allow administrators to review and manage registrations.

## Tasks

- [x] List verified pending registrations.
- [x] Search and filter registrations.
- [x] View registration details.
- [x] Approve user.
- [x] Create the initial dated primary-department assignment.
- [x] Assign additional departments.
- [x] Assign the default member role.
- [x] Reject user with reason.
- [x] Suspend user.
- [x] Reactivate user.
- [x] Record account review.
- [x] Record audit log.
- [x] Perform the implemented approval actions as one transaction.

## Deliverables

- Admin registration API
- Account lifecycle management
- Approval history

## Acceptance Criteria

Approval, role assignment, department assignment, account review, and audit logging either all succeed or all fail together.

---

# 11. Milestone 7 — Members and Departments

## Objective

Implement core church workforce management.

## Member Tasks

- [x] List members.
- [x] Search members.
- [x] Filter by department.
- [x] View member profile.
- [x] Update own profile.
- [x] Admin update member.
- [x] Archive member.
- [x] Preserve attendance history.

## Department Tasks

- [x] List departments.
- [x] Create department.
- [x] Update department.
- [x] Deactivate department.
- [x] Add member to department.
- [x] Remove active membership.
- [x] Set or clear primary department through dated assignment periods.
- [x] Assign department leader.
- [x] End leadership assignment.
- [x] Restrict leader visibility by department.

## Deliverables

- Member API
- Department API
- Role-scoped data access

## Acceptance Criteria

A member can belong to multiple departments but can have only one active primary-department assignment. `primary_department_assignments` is the sole persisted source; profile and membership records do not duplicate the designation.

---

# 12. Milestone 8 — Events

## Objective

Allow administrators to schedule attendance-enabled events.

## Tasks

- [x] Create event.
- [x] Update event.
- [x] Cancel event.
- [x] List events.
- [x] Filter events by date and status.
- [x] Assign required departments.
- [x] Validate event timing.
- [x] Configure location.
- [x] Configure geofence radius.
- [x] Configure maximum GPS accuracy.
- [x] Detect active events.
- [x] Restrict active events by member eligibility.
- [x] Handle overlapping eligible events.

## Deliverables

- Event API
- Active-event endpoint
- Eligibility rules

## Acceptance Criteria

Members only receive events for which they are eligible and whose attendance windows are active.

---

# 13. Milestone 9 — Geofence Attendance

## Objective

Implement the primary attendance workflow.

## Tasks

### Location Verification

- [x] Validate latitude.
- [x] Validate longitude.
- [x] Validate reported accuracy.
- [x] Implement Haversine distance calculation.
- [x] Compare distance with geofence radius.
- [x] Reject poor accuracy.
- [x] Reject outside-geofence attempts.

### Attendance Rules

- [x] Verify active account.
- [x] Verify event window.
- [x] Verify event eligibility.
- [x] Prevent duplicate check-in.
- [x] Calculate early status.
- [x] Calculate on-time status.
- [x] Calculate late status.
- [x] Use server time.
- [x] Record attendance evidence.
- [x] Award points transactionally.

### Manual Attendance

- [x] Record manual attendance.
- [x] Require authorized role.
- [x] Require reason.
- [x] Record actor.
- [x] Create audit log.
- [x] Correct attendance.
- [x] Adjust leaderboard ledger.

## Deliverables

- Check-in API
- Attendance history API
- Event attendance API
- Manual attendance API

## Acceptance Criteria

- Inside-geofence check-in succeeds.
- Outside-geofence check-in fails.
- Poor accuracy fails.
- Duplicate attendance fails.
- Attendance status is calculated correctly.
- Manual attendance is auditable.

---

# 14. Milestone 10 — Absence Requests

## Objective

Support fair absence handling.

## Tasks

- [x] Submit event-specific absence.
- [x] Submit date-range absence.
- [x] List own requests.
- [x] List department requests.
- [x] Approve request.
- [x] Reject request.
- [x] Request clarification.
- [x] Cancel pending request.
- [x] Apply excused status where appropriate.
- [x] Exclude approved absence from penalties.
- [x] Record review audit log.

## Deliverables

- Absence request API
- Approval workflow
- Leaderboard integration

## Acceptance Criteria

Approved absence requests do not unfairly reduce member or department scores.

---

# 15. Milestone 11 — Leaderboards

## Objective

Implement transparent and auditable ranking.

## Tasks

### Points Rules

- [x] Define Version 1 point values.
- [x] Store point reasons.
- [x] Support positive and negative adjustments.
- [x] Prevent duplicate event rewards.
- [x] Recalculate after attendance correction.

### Individual Leaderboard

- [x] Weekly ranking.
- [x] Monthly ranking.
- [x] Quarterly ranking.
- [x] Yearly ranking.
- [x] Department filter.
- [x] Attendance streak calculation.

### Department Leaderboard

- [x] Attendance rate.
- [x] Punctuality rate.
- [x] Percentage-based scoring.
- [x] Excused absence handling.
- [x] Period filtering.

## Deliverables

- Individual leaderboard API
- Department leaderboard API
- Documented scoring rules

## Acceptance Criteria

Scores can be explained from attendance and leaderboard ledger records.

---

# 16. Milestone 12 — Reports

## Objective

Provide useful operational reporting.

## Tasks

- [x] Attendance summary.
- [x] Attendance by event.
- [x] Attendance by member.
- [x] Attendance by department.
- [x] Punctuality report.
- [x] Repeated absence report.
- [x] Manual attendance report.
- [x] Pending registration report.
- [x] Date filtering.
- [x] Department filtering.
- [x] CSV export.
- [x] Department leader report restrictions.

## Deliverables

- Reports API
- CSV export
- Report tests

## Acceptance Criteria

Administrators can export accurate attendance data for a selected date range.

---

# 17. Milestone 13 — Frontend Application

## Objective

Build the complete mobile-first user experience.

## Public Pages

- [x] Landing page.
- [x] Registration page.
- [x] Login page.
- [x] Password reset.
- [x] Approval status page.

## Member Pages

- [x] Dashboard.
- [x] Active attendance event.
- [x] Location permission flow.
- [x] Check-in confirmation.
- [x] Attendance history.
- [x] Absence request form.
- [x] Individual leaderboard.
- [x] Department leaderboard.
- [x] Profile page.

## Admin Pages

- [x] Admin dashboard.
- [x] Pending registrations.
- [x] Member management.
- [x] Department management.
- [x] Event management.
- [x] Live event attendance.
- [x] Manual attendance.
- [x] Absence review.
- [x] Reports.
- [x] Audit logs for Super Administrator.

## UX States

- [x] Loading states.
- [x] Empty states.
- [x] Permission denied.
- [x] Location unavailable.
- [x] Poor GPS accuracy.
- [x] Outside geofence.
- [x] Attendance closed.
- [x] Already checked in.
- [x] Offline or network failure.

## Deliverables

- Responsive Next.js application
- Integrated API client
- Protected route layouts
- Accessible forms and navigation

## Acceptance Criteria

The core member and administrator workflows can be completed on a mobile phone without using a desktop interface.

---

# 18. Milestone 14 — Testing and Hardening

## Objective

Verify correctness, security, and reliability before production.

## Unit Tests

- [ ] Haversine calculation.
- [ ] Attendance status.
- [ ] Leaderboard scoring.
- [ ] Absence rules.
- [ ] Authorization helpers.
- [ ] Token behavior.

## Integration Tests

- [ ] Registration.
- [ ] Approval.
- [ ] Login.
- [ ] Refresh.
- [ ] Department assignment.
- [ ] Event creation.
- [ ] Successful attendance.
- [ ] Outside-geofence rejection.
- [ ] Duplicate rejection.
- [ ] Manual attendance.
- [ ] Report export.

## End-to-End Tests

- [ ] Register account.
- [ ] View pending screen.
- [ ] Admin approves account.
- [ ] User logs in.
- [ ] User grants location.
- [ ] User checks in.
- [ ] Attendance appears in history.
- [ ] Admin sees attendance.

## Security Review

- [ ] Verify secrets are excluded from Git.
- [ ] Verify access restrictions.
- [ ] Verify rate limiting.
- [ ] Verify secure cookies.
- [ ] Verify CORS.
- [ ] Verify audit logs.
- [ ] Verify sensitive values are redacted.
- [ ] Run dependency audit.

## Device Testing

- [ ] Android Chrome.
- [ ] iPhone Safari.
- [ ] Desktop Chrome.
- [ ] Location denied.
- [ ] GPS disabled.
- [ ] Poor location accuracy.
- [ ] Slow mobile network.

## Acceptance Criteria

All critical workflows pass automated tests and real-device checks.

---

# 19. Milestone 15 — Deployment

## Objective

Release Version 1 for controlled use at Arrows Church.

## Infrastructure

- [ ] Provision VPS.
- [ ] Install Docker.
- [ ] Configure PostgreSQL.
- [ ] Configure persistent volumes.
- [ ] Configure Nginx.
- [ ] Configure Cloudflare DNS.
- [ ] Configure HTTPS.
- [ ] Configure environment secrets.

## CI/CD

- [ ] Frontend deployment pipeline.
- [ ] Backend build pipeline.
- [ ] Docker image publishing.
- [ ] VPS deployment.
- [ ] Database migration step.
- [ ] Health check after deployment.
- [ ] Rollback procedure.

## Operations

- [ ] Error monitoring.
- [ ] Uptime monitoring.
- [ ] Daily database backups.
- [ ] Backup restoration test.
- [ ] Production Super Administrator.
- [ ] Production church settings.
- [ ] Initial department setup.
- [ ] Internal user onboarding.

## Release Strategy

Use a controlled rollout:

```text
Development
    ↓
Internal testing
    ↓
Department leaders
    ↓
Selected workers
    ↓
Full youth department
```

## Acceptance Criteria

The production application is secure, monitored, backed up, and usable during a real church event.

---

# 20. Recommended First Development Sprint

## Sprint Goal

Establish the complete technical foundation.

## Tasks

### Day 1

- [ ] Confirm repository structure.
- [ ] Move Next.js into `apps/web`.
- [ ] Create NestJS in `apps/api`.
- [ ] Configure root workspaces.

### Day 2

- [ ] Add PostgreSQL Docker service.
- [ ] Add environment configuration.
- [ ] Connect NestJS to PostgreSQL.
- [ ] Add `/health`.

### Day 3

- [ ] Configure Drizzle.
- [ ] Implement initial enums.
- [ ] Implement churches, users, roles, and member profiles.

### Day 4

- [ ] Implement remaining schema tables.
- [ ] Generate migration.
- [ ] Run migration.
- [ ] Add seed script.

### Day 5

- [ ] Add shared backend infrastructure.
- [ ] Add Swagger.
- [ ] Add logging.
- [ ] Add validation and error responses.
- [ ] Review Milestones 1–4.

## Sprint Completion Criteria

- Monorepo works.
- Frontend runs.
- API runs.
- PostgreSQL runs.
- Drizzle migrations run.
- Required seed data exists.
- Swagger is available.
- Health endpoint passes.

---

# 21. Project Completion Criteria

Version 1 is complete when:

- Users can register.
- Administrators can approve users.
- Active users can log in.
- Departments and members can be managed.
- Events can be scheduled.
- Members can check in using geolocation.
- Invalid attendance attempts are rejected.
- Manual attendance is auditable.
- Absence requests can be approved.
- Leaderboards calculate correctly.
- Reports can be exported.
- Core workflows are tested.
- Production is monitored and backed up.

---

# 22. Immediate Next Action

Begin:

```text
Milestone 1 — Repository and Monorepo Setup
```

The first implementation task is to restructure the repository into:

```text
apps/web
apps/api
packages/shared
docs
```
