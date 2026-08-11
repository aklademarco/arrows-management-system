CREATE TABLE IF NOT EXISTS recurring_service_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id),
  name varchar(180) NOT NULL,
  recurrence_rule varchar(40) NOT NULL,
  starts_at_local varchar(5) NOT NULL,
  duration_minutes integer NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recurring_service_name_not_blank CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT recurring_service_rule_valid CHECK (recurrence_rule IN ('FIRST_SUNDAY', 'EVERY_SUNDAY')),
  CONSTRAINT recurring_service_start_valid CHECK (starts_at_local ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT recurring_service_duration_valid CHECK (duration_minutes > 0),
  UNIQUE (church_id, name)
);

CREATE INDEX IF NOT EXISTS recurring_service_templates_church_active_idx
  ON recurring_service_templates(church_id, is_active, priority DESC);

INSERT INTO recurring_service_templates
  (church_id, name, recurrence_rule, starts_at_local, duration_minutes, priority)
SELECT id, 'Day of Trumpets', 'FIRST_SUNDAY', '08:40', 200, 100
FROM churches
ON CONFLICT (church_id, name) DO UPDATE SET
  recurrence_rule = EXCLUDED.recurrence_rule,
  starts_at_local = EXCLUDED.starts_at_local,
  duration_minutes = EXCLUDED.duration_minutes,
  priority = EXCLUDED.priority,
  is_active = true,
  updated_at = now();

INSERT INTO recurring_service_templates
  (church_id, name, recurrence_rule, starts_at_local, duration_minutes, priority)
SELECT id, 'Normal Service', 'EVERY_SUNDAY', '08:40', 195, 10
FROM churches
ON CONFLICT (church_id, name) DO UPDATE SET
  recurrence_rule = EXCLUDED.recurrence_rule,
  starts_at_local = EXCLUDED.starts_at_local,
  duration_minutes = EXCLUDED.duration_minutes,
  priority = EXCLUDED.priority,
  is_active = true,
  updated_at = now();
