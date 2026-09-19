DO $$ BEGIN
  CREATE TYPE attendance_report_delivery_status AS ENUM ('QUEUED', 'SENT', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS attendance_reports_queued_at timestamptz;

-- Do not email historical services when this feature is first deployed.
UPDATE events
SET attendance_reports_queued_at = COALESCE(attendance_finalized_at, now())
WHERE attendance_finalized_at IS NOT NULL
  AND attendance_reports_queued_at IS NULL;

CREATE TABLE IF NOT EXISTS attendance_report_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id),
  recipient_user_id uuid NOT NULL REFERENCES users(id),
  department_id uuid REFERENCES departments(id),
  scope_key varchar(80) NOT NULL,
  recipient_email varchar(255) NOT NULL,
  recipient_name varchar(255) NOT NULL,
  status attendance_report_delivery_status NOT NULL DEFAULT 'QUEUED',
  retry_count integer NOT NULL DEFAULT 0,
  attempted_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_report_delivery_unique
    UNIQUE(event_id, recipient_user_id, scope_key)
);

CREATE INDEX IF NOT EXISTS attendance_report_delivery_queue_idx
  ON attendance_report_deliveries(status, next_attempt_at, created_at);
