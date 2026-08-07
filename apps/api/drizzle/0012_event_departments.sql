CREATE TABLE "event_departments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL REFERENCES "events"("id"),
  "department_id" uuid NOT NULL REFERENCES "departments"("id"),
  "is_required" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "event_departments_event_department_unique"
    UNIQUE ("event_id", "department_id")
);

CREATE INDEX "event_departments_event_idx"
  ON "event_departments" ("event_id");
CREATE INDEX "event_departments_department_idx"
  ON "event_departments" ("department_id");
