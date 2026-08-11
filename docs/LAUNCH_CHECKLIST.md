# ACMS Phase 1 Launch Checklist

**Status:** In progress  
**Target:** Controlled internal church pilot

## Verified in the first readiness audit

- [x] Local environment files are excluded from Git.
- [x] The API health endpoint verifies PostgreSQL connectivity.
- [x] Access and refresh cookies use `httpOnly`, `sameSite=lax`, and secure mode in production.
- [x] API request DTOs use global whitelist validation.
- [x] Database changes are migration-based.
- [x] Production API configuration now fails fast when critical settings are missing.

## Critical before deployment

- [ ] Choose the production hosts for the web app, API, and PostgreSQL.
- [ ] Set `NODE_ENV=production` on the API and web services.
- [ ] Configure HTTPS `WEB_URL` and `CORS_ORIGIN`.
- [ ] Generate a production JWT secret of at least 32 random characters.
- [ ] Configure production SMTP and verify registration and password-reset email delivery.
- [ ] Configure matching Cloudinary cloud name, API key, and secret.
- [ ] Provision PostgreSQL and run every migration through `0017_ministry_communications.sql`.
- [ ] Seed the production church, roles, and first super administrator.
- [ ] Add API and authentication rate limiting.
- [ ] Resolve all critical/high dependency-audit findings.
- [ ] Add application error monitoring and uptime checks for `/api/v1/health`.
- [ ] Configure daily database backups and complete one restoration test.
- [ ] Define a migration rollback and application rollback procedure.

## Authentication and authorization checks

- [ ] Registration requires email verification.
- [ ] Pending accounts cannot use protected member routes.
- [ ] Members cannot access administrator pages or API operations.
- [ ] Department leaders see only their authorized members and workflows.
- [ ] Suspended and archived accounts lose access immediately.
- [ ] Login lockout and password-reset behavior are verified.
- [ ] A session remains usable for the required service duration.

## Attendance device checks

- [ ] Android Chrome: automatic geofence attempt and button fallback.
- [ ] iPhone Safari: automatic geofence attempt and button fallback.
- [ ] Location permission denied produces clear recovery guidance.
- [ ] GPS disabled produces clear recovery guidance.
- [ ] Weak accuracy is rejected or handled without a false check-in.
- [ ] Outside-geofence attempts are rejected.
- [ ] Duplicate attendance is prevented.
- [ ] Manual attendance correction is limited to authorized users.
- [ ] Attendance finalization and absence reconciliation are verified.

## Operational pilot setup

- [ ] Enter the exact church coordinates and approved geofence radius.
- [ ] Create production departments and assign active leaders.
- [ ] Import or register pilot members.
- [ ] Create a test event using the real service schedule.
- [ ] Train one administrator and two department leaders.
- [ ] Document who handles account, attendance, and location issues during service.
- [ ] Run one rehearsal before using ACMS for official attendance.

## Pilot release gate

ACMS is ready for the controlled pilot when a real member can register, be
approved, sign in, check in at church on both Android and iPhone, and appear in
an administrator's attendance report without developer intervention.
