# Browser push notifications

## Notification coverage

| Trigger | Recipients | Behavior |
| --- | --- | --- |
| Pastor or leader message | Existing authorized church or department recipient list | Inbox notice and push; existing optional SMS remains unchanged |
| New church event | Active members eligible for the event, including required department rules | Manual and automatically materialized recurring events |
| Event change or cancellation | Eligible active members | Unchanged edit submissions and repeated cancellation do not repeat notices; geofence setting changes also notify affected events |
| Event reminder | Eligible active members at reminder time | Once 24 hours before and once 1 hour before each scheduled start |
| Service duty assignment | Newly assigned member and previous assignee on removal/reassignment | Admin event detail → liturgy → Assigned member; unchanged assignments are quiet |
| Account approval | Approved applicant | Inbox notice; push when the applicant opted in on the account-status screen after verifying their email; approval email remains available |
| Department/leadership change | Affected member | Membership added/ended, primary department changes, leadership assigned/revoked, and ministry-role changes |

Existing publicity and ministry-content inbox notifications also use push delivery.
A browser must opt in; users without a registered browser still receive inbox
notifications. Pastors have an inbox at `/pastor/notifications`, leaders at
`/leader/inbox`, and members at `/member/notifications`. The `/notifications`
route chooses the correct inbox after authentication.

An event with no department restrictions is open to all active members. Otherwise,
recipients follow the existing membership-at-event-start eligibility rule. Service
duties can only be assigned to eligible active members in the same church, and
only while the duty is pending in a scheduled or active event.

## Reminders and rescheduling

The API checks every minute, so reminders normally arrive within a minute of the
24-hour or 1-hour threshold, plus delivery latency. A late-starting worker catches
up while the event is still in that reminder window. Inside the final hour, it
sends only the 1-hour reminder rather than two simultaneous catch-up alerts.
Past, draft, cancelled and completed events are excluded. Event start changes
create a new reminder schedule. Old queued reminders are suppressed before sending.
Already delivered notifications cannot be recalled; event changes create a new notice.

Reminder-run records are unique per event, scheduled start and threshold. Inbox
notice creation and reminder-run insertion are one transaction. Multiple API
instances and restarts therefore do not create repeated reminders.

## Delivery and privacy

Business changes and their inbox notices commit together. Inbox rows are the
initial durable outbox. A worker running every 15 seconds expands new notices into
per-device delivery records, with a unique notification/device constraint.

Workers claim one delivery at a time using PostgreSQL `SKIP LOCKED`, a 60-second
lease and a unique lease identifier. Expired leases recover from crashes; an old
worker cannot overwrite the result of a newer claim. Delivery rechecks account
status, church, device ownership, subscription generation, expiry and event state.
Revoked, suspended, expired and reassigned devices are excluded. Transient Firebase
failures retry up to five attempts with exponential backoff, jitter and `Retry-After`
support. Explicit `UNREGISTERED` responses revoke only that device generation.
Permanent failures remain recorded in `push_deliveries` for investigation.

Delivery is at least once: a crash after Firebase accepts a request but before the
database records success can cause a retry. Stable notification IDs are used as
browser notification tags to replace an already-visible duplicate. Notifications
expire after at most 24 hours; event notices/reminders expire at their start, and
duty notices at the event end. The same remaining lifetime is passed to FCM.

Push payloads contain category titles and “Open ACMS to view the details,” not
private message bodies, personal assignments or approval-review details. Full
content stays in the authenticated inbox. Foreground alerts appear across member,
leader and pastor workspaces. Custom worker click destinations are restricted to
the same origin.

## Device lifecycle

The inbox no longer includes a browser registration panel. A floating invitation
appears across member, leader and pastor workspaces when registration is needed.
Existing opt-ins are refreshed with the API before deciding to show it. “Not now”
or the close button dismisses it for the current login, including page reloads;
a fresh successful login clears that dismissal. Unsupported or unconfigured
browsers do not show the invitation. Permission is requested only after clicking
“Enable notifications”. Logout still revokes registration, so the next login may
require opting in again.

Registrations expire after 30 days and are refreshed on authenticated workspace
loads only when the browser already opted in. Permission is requested only on a
user gesture. Token rotation soft-revokes the browser's previous token; account
switching changes its subscription generation so queued notices cannot transfer
to a new owner.

The browser receives a random revocation capability in an HTTP-only, secure-in-
production cookie. Only its SHA-256 hash is stored in PostgreSQL. Logout can revoke
this one browser even when the access JWT has expired. Login retries any pending
cleanup before changing accounts. If the API is unreachable, logout still clears
authentication cookies and retains cleanup credentials for the next login; already
queued browser alerts cannot be recalled. Notification bodies remain private.

Pending applicants register using the existing password-verified account-status
flow, after email verification. These devices are restricted to approval alerts
until the member explicitly enables normal notifications after signing in. This
does not grant applicants dashboard access or relax the existing auth guards.

## Configuration and rollout

1. Run `pnpm db:migrate` before restarting the API. The new delivery migration is
   `0034_notification_delivery.sql`; `0035_church_timezone.sql` supplies the field
   already present in the existing Drizzle church schema. `0033_push_devices.sql`
   is also required if not yet applied.
2. Existing inbox entries are marked processed so rollout does not replay old
   messages. Existing device registrations are soft-revoked because they lack
   logout cleanup capabilities. Users must enable browser notifications once again.
3. Configure the public Firebase web variables in `.env.example`, including
   `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, at web build time. Rebuild after changing them.
4. On the API, set `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL` and `FCM_PRIVATE_KEY` from a
   service account authorized to send FCM messages, then set `PUSH_ENABLED=true`.
   The API project must match the web Firebase project. The Cloud Messaging HTTP
   v1 API must be enabled. The private key accepts escaped newline sequences.
   Never put server credentials in `NEXT_PUBLIC_*` variables or source control.
5. Serve the web app over HTTPS. Supported browsers also allow localhost for local
   testing. On iOS, use a supported Home Screen-installed app.

The sender uses Google's OAuth token endpoint and FCM HTTP v1 with Node's existing
crypto/fetch APIs, without adding a dependency. It follows the official
[FCM authentication guide](https://firebase.google.com/docs/cloud-messaging/send/v1-api)
and [FCM error handling guidance](https://firebase.google.com/docs/cloud-messaging/error-codes).
No Firebase request is sent when push delivery is disabled or unconfigured.
Reminders and in-app notifications continue to work independently of Firebase.

## API

- `PUT /api/v1/notifications/push-device`: authenticated device registration.
  Body: `{ "token": "<FCM token>", "previousSecret": "<optional browser revocation capability>" }`.
  Returns `{ enabled, revocationSecret }` inside the standard data envelope.
  Web Server Actions store the capability in an HTTP-only cookie and do not return it to client components.
- `DELETE /api/v1/notifications/push-device`: authenticated soft-revocation by token.
- `POST /api/v1/push-devices/revoke`: possession-based cleanup of one device,
  with `{ "secret": "<64-character revocation capability>" }`. Idempotent and rate-limited;
  it never reveals whether a matching device exists.
- `POST /api/v1/auth/account-status`: existing credential verification, with an
  optional `pushToken` for verified pending applicants. No account ID can be supplied.
- `GET /api/v1/liturgies/events/:eventId/assignees`: administrators only; eligible members.
- `PUT /api/v1/liturgies/items/:itemId/assignment`: administrators only;
  `{ "memberId": "<UUID>" }` to assign or `{ "memberId": null }` to remove.

## Verification and operations

Automated tests exercise the actual migrations and repository transactions in a
disposable PostgreSQL schema, including recipient scoping, rollback, both reminder
windows, cancellation/rescheduling, approval-only subscriptions, assignment changes,
queue deduplication, concurrent claiming, stale-lease fencing and device ownership.
Provider tests mock Firebase; web tests cover permission, registration, approval
credential isolation and cleanup with expired login cookies.

Run the API suite with `NOTIFICATION_TEST_DATABASE_URL` pointing to a disposable
PostgreSQL instance to include database tests. Without it, those tests are skipped.
The test role needs permission to create/drop test schemas and install `btree_gist`.
The test suite never uses `DATABASE_URL` for this purpose.

For deployment verification with a test account: enable push, send a church or
scoped leader message, create/update/cancel an event, exercise both reminder
thresholds, change a duty assignment, approve an opted-in verified applicant, and
change department/leadership assignments. Check the inbox, foreground banner and
background OS notification. Verify old recipients stop receiving messages after
account switching, token revocation and account suspension.

Inspect `push_deliveries.status`, `attempts`, `error_code`, `next_attempt_at` and
`sent_at` to diagnose delivery. A successful send records Firebase acceptance,
not proof that a person viewed the notification. Logs and audit events omit tokens
and message bodies. The schema migration and workflow tests were run against an
isolated local PostgreSQL instance; deployment migrations and live Firebase/browser
OS delivery still require verification in the target environment.
