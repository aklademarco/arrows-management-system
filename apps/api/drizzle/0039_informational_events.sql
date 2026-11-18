-- Informational church events: online link, timezone, cancellation, and a
-- revision counter used as the calendar SEQUENCE for updated imports.
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS online_url varchar(500),
  ADD COLUMN IF NOT EXISTS time_zone varchar(60) NOT NULL DEFAULT 'Africa/Accra',
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS cancellation_reason varchar(300),
  ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;

ALTER TABLE announcements
  ADD CONSTRAINT announcements_cancel_consistent
    CHECK (
      (cancelled_at IS NULL AND cancelled_by IS NULL AND cancellation_reason IS NULL)
      OR (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL)
    ),
  ADD CONSTRAINT announcements_only_events_cancel
    CHECK (cancelled_at IS NULL OR kind = 'EVENT'),
  ADD CONSTRAINT announcements_online_url_https
    CHECK (online_url IS NULL OR online_url LIKE 'https://%'),
  ADD CONSTRAINT announcements_revision_not_negative
    CHECK (revision >= 0);

-- "Events need an end after the start" is enforced by the API on create and
-- edit, not here: a table constraint would also block archiving or cancelling
-- older events saved without an end time.
