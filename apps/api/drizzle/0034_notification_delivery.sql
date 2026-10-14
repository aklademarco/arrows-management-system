ALTER TABLE notifications
  ADD COLUMN deduplication_key varchar(255) UNIQUE,
  ADD COLUMN event_id uuid REFERENCES events(id),
  ADD COLUMN event_starts_at timestamptz,
  ADD COLUMN expires_at timestamptz,
  ADD COLUMN push_enqueued_at timestamptz;
-- Do not replay the historical inbox when delivery is enabled.
UPDATE notifications SET push_enqueued_at = now();
CREATE INDEX notifications_push_pending_idx ON notifications(created_at) WHERE push_enqueued_at IS NULL;
CREATE INDEX notifications_recipient_created_idx ON notifications(church_id, recipient_user_id, created_at);
ALTER TABLE push_devices
  ADD COLUMN generation uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN revocation_hash varchar(64) UNIQUE,
  ADD COLUMN approval_only boolean NOT NULL DEFAULT false,
  ADD COLUMN subscribed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days';
-- Existing registrations lack logout revocation credentials. Require a fresh opt-in.
UPDATE push_devices SET revoked_at = now();
ALTER TABLE event_liturgy_items ADD COLUMN assigned_member_id uuid REFERENCES member_profiles(id);
CREATE INDEX event_liturgy_items_assigned_member_idx ON event_liturgy_items(assigned_member_id);
CREATE TABLE push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id),
  device_id uuid NOT NULL REFERENCES push_devices(id),
  device_generation uuid NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'FAILED', 'SKIPPED')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_id uuid,
  lease_until timestamptz,
  error_code varchar(100),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX push_deliveries_notification_device_idx ON push_deliveries(notification_id, device_id);
CREATE INDEX push_deliveries_due_idx ON push_deliveries(status, next_attempt_at);
CREATE TABLE event_reminder_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id),
  starts_at timestamptz NOT NULL,
  hours_before integer NOT NULL CHECK (hours_before IN (1, 24)),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_reminder_runs_unique UNIQUE(event_id, starts_at, hours_before)
);
