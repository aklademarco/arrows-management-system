ALTER TABLE liturgy_templates
  ADD COLUMN IF NOT EXISTS recurrence_rule varchar(40) NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS liturgy_templates_recurrence_idx
  ON liturgy_templates(church_id, is_active, recurrence_rule, priority);
