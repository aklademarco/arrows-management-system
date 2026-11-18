# Phase Two — Church Engagement and Giving

Status: Draft for discussion  
Planning date: 12 November 2026

## Purpose and scope

Extend ACMS with four member-facing features:

1. A church feed with announcements, comments, and reactions.
2. Informational events with external calendar export and no attendance tracking.
3. A full Bible reader with a daily verse.
4. Online tithe and offertory payments through mobile money only.

This document describes the user's proposed second development phase. The
existing ROADMAP.md uses “Phase 2” for controlled church rollout; this proposal
is a separate scope pending agreement and does not replace those release gates.
The publishing roles, full Bible reader, and mobile-money-only scope are
confirmed. Remaining proposals and delivery dates require further agreement.

## Current foundation

Repository inspection found authentication, role-based portals, attendance
events, notifications, Cloudinary uploads, and audit infrastructure. Their
production readiness must be verified before reuse.

The working tree also contains uncommitted announcement work: an announcements
table with ANNOUNCEMENT and EVENT kinds, publishing/editing/archiving endpoints,
flyer uploads, and member/leader/pastor/admin views. Its current publishing
policy includes department leaders. This is work in progress, not evidence of
a tested or deployed feature. Review and extend it before introducing another
feed or informational-event model.

The inspected announcement card/controller do not yet expose comments,
reactions, or calendar export. Existing attendance events require attendance
windows and geofence settings, so they should not back informational events.

## 1. Feed and announcements

Member experience:

- Browse a paginated church feed, newest first, with pinned notices first.
- Read titles, text, optional flyers, author names, and publication times.
- Open a post to read and add comments.
- Edit or remove one's own comments, with an edited indicator where relevant.
- React using a small initial set, proposed as Like, Amen, and Love.
- Change or remove a reaction; allow one active reaction per member per post.
- Report an inappropriate comment for review.

Publishing and moderation:

- Confirmed publishers: admins, pastors, and department leaders. Ordinary members
  can comment and react. Church-wide versus department-only audiences remain
  a decision to confirm.
- Department leaders can edit/archive their own posts. Require a current active
  leadership assignment when authorizing leader publishing and management.
- Admins and pastors can edit/archive posts, pin notices, close comments, and
  hide reported comments with a recorded moderation reason.
- Preserve archived content and moderation audit history; hide it from normal views.
- Restrict reading and interaction to active, approved members in the same church.
- Validate text on the server, render it safely, rate-limit writes, and enforce
  ownership and moderation permissions on every mutation.
- Reuse the notification system for important notices and comment activity;
  group activity and avoid notifying every member for every comment.

Initial boundary: flat comments, post reactions, and chronological ordering.
Nested replies, video uploads, and reactions to comments can follow later.

Acceptance: duplicate/retried reactions produce one active record, unauthorized
edits fail, hidden content is inaccessible through direct URLs, and archived or
closed posts reject new comments. Keyboard and screen-reader users can operate
all interaction controls.

## 2. Events and external calendars

- Provide a distinct Events section with upcoming and past views and detail pages.
- Store title, description, optional flyer/theme, venue or online URL, start,
  end, timezone, and scheduled/cancelled status.
- Require an end time after the start for timed calendar exports.
- Allow authorized publishers to create, update, cancel, and archive events.
- Offer “Add to Google Calendar” and a downloadable .ics file for Apple
  Calendar, Outlook, and other compatible clients.
- Use Africa/Accra as the initial church timezone; store timestamps consistently
  and include explicit timezone information in presentation and exports.
- Exports must contain only shareable event details, with no member data or tokens.
- Assign a stable calendar UID; escape calendar text and preserve event revision
  information for clients that support updated imports.
- Explain that adding/downloading an event creates an external calendar copy;
  changes and cancellations are communicated in ACMS and are not guaranteed to
  synchronize to that copy. Calendar subscriptions are a later option.

These events must never create check-ins, absence records, attendance windows,
attendance reminders, attendance scores, or leaderboard entries. Exporting an
event must not register the member for anything. RSVP, ticketing, and event
payments are outside the first release.

Acceptance: Google export and .ics import show the intended Ghana date/time on
Android, iPhone, and desktop; cancelled events are clearly marked; publishing,
editing, cancelling, and exporting create no attendance side effects.

## 3. Bible and daily verses

- Show today's verse on the dashboard and Bible page, with its reference and
  translation clearly identified.
- Use the same daily selection for all members, based on Africa/Accra's date.
- Let an authorized editor schedule verses ahead of time; prohibit two active
  selections for the same church date and translation.
- Prepare an approved fallback selection so a missing schedule or provider
  outage does not leave the daily verse blank.
- Support copying/sharing verse text and reference within the chosen license.
- Include a full Bible reader: navigate book/chapter, open a daily verse in
  context, adjust text size, and remember the last reading position.
- Start with one approved translation; additional translations, full-text
  search, notes, reading plans, audio, and offline downloads are later scope.

Before implementation, choose the translation/content source and verify its
rights for display, attribution, sharing, caching, and distribution. Use a
content adapter so provider changes do not affect the UI. Persist or cache only
what the license permits. The confirmed full reader requires an approved source
covering the complete selected translation.

Acceptance: the verse changes on the Ghana calendar date; references resolve to
the right passage; missing schedules/provider errors have a useful fallback;
attribution is visible and reading controls are accessible.

## 4. Tithe and offertory

Member experience:

- Choose Tithe or Offertory, enter an amount, review the total, and proceed to
  the provider's hosted checkout.
- Confirmed payment method: mobile money only; card payments are outside this
  phase. Proposed initial currency: GHS. Confirm supported mobile money networks,
  currency, and checkout behavior with the selected provider.
- See pending, successful, failed, or cancelled status and a clear retry flow.
- View one's own giving history and download a receipt after verified success.
- Show the church's verified recipient name and disclose any applicable fees
  before payment authorization.

Payment integrity and finance operations:

- Keep provider credentials on the server; never collect or store mobile money
  PINs or authorization codes in ACMS.
- Create server-owned payment attempts with unique references, integer
  minor-unit amounts, currency, category, member, and church recipient.
- Treat browser returns as navigation only. Confirm payment using authenticated
  provider verification and verify reference, amount, currency, and recipient.
- Authenticate webhooks using the provider's documented mechanism. Handle
  duplicate, delayed, and out-of-order events idempotently; issue one receipt
  per confirmed successful payment.
- Reconcile stale pending payments and provider transaction/settlement records
  through retryable background work, with failed jobs visible to operators.
- Retain immutable payment events and adjustments. Track refunds, reversals,
  and disputes without deleting or overwriting the original successful record.
- Separate giving records from provider attempts so a failed attempt can be
  retried without duplicating the member's contribution.
- Provide a specifically authorized finance permission for reports, date/category
  filters, reconciliation, and CSV export. Pastor/leader roles alone must not
  expose individual giving. Audit sensitive finance access and changes.
- Members can view only their own giving. Do not expose amounts in feeds,
  leaderboards, general dashboards, analytics logs, or notification previews.

Initial boundary: one-time payments, two giving categories, one church account,
and one provider. Recurring mandates, pledges, split settlements, guest giving,
and in-app refund initiation are later scope. Define the operational refund
process and support contact before launch. Receipts acknowledge payment;
tax-related wording requires a separately confirmed requirement.

Acceptance: sandbox flows cover success, failure, cancellation, timeout,
duplicate submission, forged browser success, wrong amount/currency/recipient,
duplicate webhooks, delayed success, reversal, and reconciliation. Verify
finance/member permissions and conduct an authorized small live payment plus
settlement check before broad release.

## Implementation approach

- Reuse the announcement model for posts and informational events, with separate
  Feed and Events views. Add comments, reactions, moderation, pinning, and event
  cancellation through reviewed migrations; avoid duplicating attendance logic.
- Add Bible and giving as focused NestJS modules with thin controllers,
  validated DTOs, service-owned rules, and provider interfaces.
- Keep Next.js pages server-rendered where practical; add client state for
  comments, reactions, reader controls, and payment status only as needed.
- Use UUID keys, foreign keys, church scoping, pagination, and query-driven
  indexes. Enforce uniqueness for reactions, daily verse selections, provider
  references/events, and receipts at the database level.
- Reuse authenticated routes, notification delivery, audit conventions, and
  storage infrastructure after reviewing their suitability.
- Document final schemas/endpoints in ERD.md and API.md during implementation;
  update PRD.md, SRS.md, and ROADMAP.md after scope decisions are agreed.

## Delivery order and gates

| Milestone | Deliverable | Release gate |
| --- | --- | --- |
| A | Confirm policies; review existing announcement changes; choose Bible source and payment provider | Scope, permissions, content rights, provider sandbox, and church settlement ownership established |
| B | Feed, comments, reactions, moderation | Unit tests for rules, API/database integration tests, access-control checks, and mobile manual review pass |
| C | Informational Events and calendar export | Calendar imports and attendance-isolation regression tests pass |
| D | Full Bible reader and daily verse | Ghana date rollover, content attribution, fallback, and reading flows verified |
| E | Mobile money giving, receipts, finance access, reconciliation | Payment integrity tests, operational runbook, and authorized live settlement check pass |

Start provider onboarding and Bible content approval during A because they can
block later delivery. Ship each completed milestone behind a controlled rollout.
Estimate effort after the existing announcement work is reviewed and external
dependencies are confirmed; avoid promising a calendar date at this stage.

Every milestone requires appropriate unit/integration tests, manual verification
on Android Chrome and iPhone Safari, accessible controls, deployment/migration
review, and a rollback plan. Confirm existing attendance and authentication
remain stable. Before giving launches, monitor webhook failures, stale pending
payments, reconciliation differences, and support escalation.

## Confirmed decisions

1. Admins, pastors, and department leaders can publish feed posts.
2. A full Bible reader and daily verses are both included in this phase.
3. Tithe and offertory payments use mobile money only.

## Decisions to confirm

1. Are posts church-wide initially, or are department-only audiences required?
2. Which Bible translation, language, content source, and daily verse editor?
3. Which mobile money provider/networks, currency, existing church account,
   settlement owner, fees, refund process, and finance access holders?

Unconfirmed details remain proposals rather than approved requirements.
