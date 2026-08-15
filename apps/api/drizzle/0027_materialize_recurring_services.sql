ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "recurring_template_id" uuid
  REFERENCES "recurring_service_templates"("id");

CREATE UNIQUE INDEX IF NOT EXISTS "events_recurring_template_start_unique"
  ON "events" ("recurring_template_id", "starts_at")
  WHERE "recurring_template_id" IS NOT NULL;
