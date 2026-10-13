# Browser push notifications

## Review and current implementation

The original Firebase commits initialized the SDK but did not register browsers,
request permission, store tokens, or provide notification controls. The worker
contained a fixed Firebase project and logged message contents.

The member notification screen and leader inbox now provide explicit enable and
disable controls. Permission is requested only after clicking Enable. Unsupported
browsers, blocked permission, missing configuration and API failures produce
visible status messages. Foreground messages appear in the settings component
while either inbox is open. Background notification payloads use Firebase's
built-in display; data-only payloads with a `title` are displayed by the worker.
Custom notification clicks accept only same-origin links.

Registration is a separate milestone from automatic delivery. Existing church
announcements and messages still create in-app notifications only.

## Configuration and rollout

1. Fill in the `NEXT_PUBLIC_FIREBASE_*` variables in `.env.example`, including the
   public VAPID key from Firebase Cloud Messaging Web Push certificates. All
   variables must belong to the same Firebase project. They are public web
   configuration, not service-account credentials. Supply them at web build time
   and rebuild after changing them.
2. Apply `0033_push_devices.sql` through the existing migration command:
   `pnpm db:migrate`. The migration creates a new table and indexes without
   modifying existing notification records.
3. Serve over HTTPS (localhost also works in supporting browsers). On iOS, use
   an installed Home Screen app on a supported OS version.
4. Visit `/member/notifications` or `/leader/inbox` and enable notifications.
   Confirm permission and successful registration before testing delivery.

`/firebase-config.js` serves only public web configuration with no-store headers.
The worker imports it, so deployments no longer contain a fixed Firebase project.
Worker updates bypass the browser HTTP cache.

## API

Both endpoints require the existing authenticated guard:

- `PUT /api/v1/notifications/push-device`: register or reactivate a device.
- `DELETE /api/v1/notifications/push-device`: soft-revoke the caller's device.

Body: `{ "token": "<FCM registration token>" }`. Tokens are validated with a
4096-character maximum. The authenticated identity supplies user and church;
clients cannot choose either. Registration atomically transfers a reused browser
token to its new owner. Revocation matches both user and church. A SHA-256 token
hash provides a bounded unique index. Registration/revocation writes audit events
without including tokens. The browser retains its token locally so it can request
revocation after permission is blocked. No endpoint lists tokens.

## Delivery work still required

Before enabling automatic church-message push delivery:

- Add server-side FCM credentials and a sender, with durable retries/outbox handling
  after notification transactions commit. Never expose server credentials publicly.
- Connect device revocation to logout, account changes and account suspension;
  refresh rotated browser tokens and expire stale registrations. Until this is
  implemented, do not send sensitive production messages to stored tokens.
- Exclude revoked devices and inactive accounts, handle FCM invalid-token responses,
  and keep message bodies and tokens out of logs.
- Mount foreground handling across authenticated workspaces if alerts should be
  visible outside the inbox. Add per-device state and delivery preferences.

## Verification

Automated tests cover registration action validation, API failures, authentication
boundaries, DTO validation, foreground-independent worker handling, duplicate
suppression and unsafe click destinations. API integration tests use the actual
controller and service with an overridden authentication guard and repository;
they do not validate PostgreSQL constraints or the production JWT guard.

Manual checks to perform with a configured Firebase project and migrated database:

1. Enable in a supported browser; verify the permission prompt and one device row.
2. Re-enable; verify the same row is updated. Disable; verify soft revocation.
3. Deny permission, retry, and verify useful guidance with no false success.
4. Send a Firebase Console test notification to this browser's token. Check the
   inbox foreground message, then background the app and check a single OS alert.
5. Send a data-only test message with `title`, `body` and `link`; check its display
   and that an external link opens the inbox instead.
6. Repeat on a second account/browser and verify revocation cannot affect a device
   owned by another account. Confirm graceful behavior with configuration absent.

Live Firebase delivery and database migration have not been run in this change.
Firebase behavior follows the official [receive messages guide](https://firebase.google.com/docs/cloud-messaging/web/receive-messages).
