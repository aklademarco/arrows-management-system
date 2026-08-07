CREATE TYPE "absence_request_status" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'NEEDS_CLARIFICATION',
  'CANCELLED'
);

CREATE TYPE "attendance_punctuality_status" AS ENUM (
  'EARLY',
  'ON_TIME',
  'LATE'
);

CREATE TABLE "absence_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL REFERENCES "member_profiles"("id"),
  "event_id" uuid REFERENCES "events"("id"),
  "starts_on" date,
  "ends_on" date,
  "reason" varchar(150) NOT NULL,
  "details" text,
  "status" "absence_request_status" DEFAULT 'PENDING' NOT NULL,
  "reviewed_by" uuid REFERENCES "users"("id"),
  "review_note" text,
  "reviewed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "absence_requests_single_mode" CHECK (
    ("event_id" IS NOT NULL AND "starts_on" IS NULL AND "ends_on" IS NULL)
    OR ("event_id" IS NULL AND "starts_on" IS NOT NULL AND "ends_on" IS NOT NULL AND "ends_on" >= "starts_on")
  ),
  CONSTRAINT "absence_requests_reason_not_blank" CHECK (char_length(btrim("reason")) > 0)
);

CREATE INDEX "absence_requests_member_status_idx" ON "absence_requests" ("member_id", "status");
CREATE INDEX "absence_requests_event_idx" ON "absence_requests" ("event_id");
CREATE INDEX "absence_requests_range_idx" ON "absence_requests" ("starts_on", "ends_on");

ALTER TABLE "attendance_records"
  ADD COLUMN "punctuality_status" "attendance_punctuality_status";

ALTER TABLE "attendance_records"
  ADD COLUMN "absence_request_id" uuid REFERENCES "absence_requests"("id");

-- An absence request may only be linked to an excused outcome. This does not
-- force every EXCUSED row to carry one (manual corrections may excuse without a
-- request), it only prevents a request from being attached to a non-excused row.
ALTER TABLE "attendance_records"
  ADD CONSTRAINT "attendance_records_absence_request_only_excused" CHECK (
    "absence_request_id" IS NULL OR "status" = 'EXCUSED'
  );
