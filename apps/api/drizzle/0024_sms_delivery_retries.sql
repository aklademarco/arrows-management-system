ALTER TABLE leadership_message_recipients
  ADD COLUMN IF NOT EXISTS sms_retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sms_next_attempt_at timestamptz;

CREATE INDEX IF NOT EXISTS leadership_message_sms_retry_idx
  ON leadership_message_recipients(sms_status, sms_next_attempt_at, created_at);
