# Development Roadmap

## Arrows Church Management System (ACMS)

**Version:** 1.0  
**Status:** Planned  
**Delivery Model:** Milestone-based  
**Architecture:** Next.js + NestJS + PostgreSQL + Drizzle ORM  

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

| Milestone | Name | Main Outcome |
|---|---|---|
| M0 | Planning and Documentation | Requirements and architecture approved |
| M1 | Repository and Monorepo Setup | Frontend and backend workspace ready |
| M2 | Local Infrastructure | PostgreSQL and Docker running |
| M3 | Database Foundation | Drizzle schema and migrations complete |
| M4 | Backend Core | API foundation, validation, logging, and errors |
| M5 | Authentication | Registration, login, refresh, logout |
| M6 | Account Approval | Admin approval and account lifecycle |
| M7 | Members and Departments | Core church workforce data |
| M8 | Events | Event scheduling and eligibility |
| M9 | Attendance | Geofence and manual attendance |
| M10 | Absence Requests | Excused absence workflow |
| M11 | Leaderboards | Individual and department ranking |
| M12 | Reports | Analytics and CSV export |
| M13 | Frontend Application | Complete member and admin interfaces |
| M14 | Testing and Hardening | Automated tests and security checks |
| M15 | Deployment | Production release |

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

- [ ] Add PostgreSQL to `docker-compose.yml`.
- [ ] Create development database.
- [ ] Add persistent Docker volume.
- [ ] Add database health check.
- [ ] Add `.env.example`.

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

- [ ] Add commands to start infrastructure.
- [ ] Add commands to stop infrastructure.
- [ ] Document database connection.
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

- [ ] Public registration endpoint.
- [ ] Email normalization.
- [ ] Phone normalization.
- [ ] Password validation.
- [ ] Argon2 password hashing.
- [ ] Default `PENDING_APPROVAL` status.
- [ ] Requested department validation.
- [ ] Duplicate account handling.

### Login

- [ ] Credential verification.
- [ ] Account status handling.
- [ ] Access token generation.
- [ ] Refresh token generation.
- [ ] Refresh token hashing.
- [ ] Last-login tracking.
- [ ] Failed-login tracking.
- [ ] Temporary account lockout.

### Sessions

- [ ] Token refresh.
- [ ] Refresh-token rotation.
- [ ] Logout.
- [ ] Session revocation.
- [ ] Current-user endpoint.

### Password Reset

- [ ] Reset request.
- [ ] Secure reset token.
- [ ] Reset confirmation.
- [ ] Invalidate old sessions after reset.

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

- [ ] List pending registrations.
- [ ] Search and filter registrations.
- [ ] View registration details.
- [ ] Approve user.
- [ ] Create the initial dated primary-department assignment.
- [ ] Assign additional departments.
- [ ] Assign roles.
- [ ] Reject user with reason.
- [ ] Suspend user.
- [ ] Reactivate user.
- [ ] Record account review.
- [ ] Record audit log.
- [ ] Perform approval as one transaction.

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

- [ ] List members.
- [ ] Search members.
- [ ] Filter by department.
- [ ] View member profile.
- [ ] Update own profile.
- [ ] Admin update member.
- [ ] Archive member.
- [ ] Preserve attendance history.

## Department Tasks

- [ ] List departments.
- [ ] Create department.
- [ ] Update department.
- [ ] Deactivate department.
- [ ] Add member to department.
- [ ] Remove active membership.
- [ ] Set or clear primary department through dated assignment periods.
- [ ] Assign department leader.
- [ ] End leadership assignment.
- [ ] Restrict leader visibility by department.

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

- [ ] Create event.
- [ ] Update event.
- [ ] Cancel event.
- [ ] List events.
- [ ] Filter events by date and status.
- [ ] Assign required departments.
- [ ] Validate event timing.
- [ ] Configure location.
- [ ] Configure geofence radius.
- [ ] Configure maximum GPS accuracy.
- [ ] Detect active events.
- [ ] Restrict active events by member eligibility.
- [ ] Handle overlapping eligible events.

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

- [ ] Validate latitude.
- [ ] Validate longitude.
- [ ] Validate reported accuracy.
- [ ] Implement Haversine distance calculation.
- [ ] Compare distance with geofence radius.
- [ ] Reject poor accuracy.
- [ ] Reject outside-geofence attempts.

### Attendance Rules

- [ ] Verify active account.
- [ ] Verify event window.
- [ ] Verify event eligibility.
- [ ] Prevent duplicate check-in.
- [ ] Calculate early status.
- [ ] Calculate on-time status.
- [ ] Calculate late status.
- [ ] Use server time.
- [ ] Record attendance evidence.
- [ ] Award points transactionally.

### Manual Attendance

- [ ] Record manual attendance.
- [ ] Require authorized role.
- [ ] Require reason.
- [ ] Record actor.
- [ ] Create audit log.
- [ ] Correct attendance.
- [ ] Adjust leaderboard ledger.

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

- [ ] Submit event-specific absence.
- [ ] Submit date-range absence.
- [ ] List own requests.
- [ ] List department requests.
- [ ] Approve request.
- [ ] Reject request.
- [ ] Request clarification.
- [ ] Cancel pending request.
- [ ] Apply excused status where appropriate.
- [ ] Exclude approved absence from penalties.
- [ ] Record review audit log.

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

- [ ] Define Version 1 point values.
- [ ] Store point reasons.
- [ ] Support positive and negative adjustments.
- [ ] Prevent duplicate event rewards.
- [ ] Recalculate after attendance correction.

### Individual Leaderboard

- [ ] Weekly ranking.
- [ ] Monthly ranking.
- [ ] Quarterly ranking.
- [ ] Yearly ranking.
- [ ] Department filter.
- [ ] Attendance streak calculation.

### Department Leaderboard

- [ ] Attendance rate.
- [ ] Punctuality rate.
- [ ] Percentage-based scoring.
- [ ] Excused absence handling.
- [ ] Period filtering.

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

- [ ] Attendance summary.
- [ ] Attendance by event.
- [ ] Attendance by member.
- [ ] Attendance by department.
- [ ] Punctuality report.
- [ ] Repeated absence report.
- [ ] Manual attendance report.
- [ ] Pending registration report.
- [ ] Date filtering.
- [ ] Department filtering.
- [ ] CSV export.
- [ ] Department leader report restrictions.

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

- [ ] Landing page.
- [ ] Registration page.
- [ ] Login page.
- [ ] Password reset.
- [ ] Approval status page.

## Member Pages

- [ ] Dashboard.
- [ ] Active attendance event.
- [ ] Location permission flow.
- [ ] Check-in confirmation.
- [ ] Attendance history.
- [ ] Absence request form.
- [ ] Individual leaderboard.
- [ ] Department leaderboard.
- [ ] Profile page.

## Admin Pages

- [ ] Admin dashboard.
- [ ] Pending registrations.
- [ ] Member management.
- [ ] Department management.
- [ ] Event management.
- [ ] Live event attendance.
- [ ] Manual attendance.
- [ ] Absence review.
- [ ] Reports.
- [ ] Audit logs for Super Administrator.

## UX States

- [ ] Loading states.
- [ ] Empty states.
- [ ] Permission denied.
- [ ] Location unavailable.
- [ ] Poor GPS accuracy.
- [ ] Outside geofence.
- [ ] Attendance closed.
- [ ] Already checked in.
- [ ] Offline or network failure.

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
