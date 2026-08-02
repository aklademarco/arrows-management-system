CREATE TYPE "event_status" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'CANCELLED', 'COMPLETED');
CREATE TYPE "attendance_status" AS ENUM ('EARLY', 'ON_TIME', 'LATE', 'ABSENT', 'EXCUSED');
CREATE TYPE "attendance_method" AS ENUM ('GEOLOCATION', 'MANUAL', 'SYSTEM');

CREATE TABLE "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL REFERENCES "churches"("id"),
  "name" varchar(180) NOT NULL,
  "event_type" varchar(80) NOT NULL,
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "attendance_opens_at" timestamptz NOT NULL,
  "attendance_closes_at" timestamptz NOT NULL,
  "early_until" timestamptz,
  "late_after" timestamptz NOT NULL,
  "location_name" varchar(180),
  "latitude" numeric(9,6) NOT NULL,
  "longitude" numeric(9,6) NOT NULL,
  "geofence_radius_meters" integer NOT NULL,
  "maximum_accuracy_meters" integer DEFAULT 50 NOT NULL,
  "status" "event_status" DEFAULT 'DRAFT' NOT NULL,
  "created_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "events_valid_time_range" CHECK ("ends_at" > "starts_at"),
  CONSTRAINT "events_valid_attendance_window" CHECK ("attendance_closes_at" > "attendance_opens_at"),
  CONSTRAINT "events_positive_geofence_radius" CHECK ("geofence_radius_meters" > 0),
  CONSTRAINT "events_valid_latitude" CHECK ("latitude" BETWEEN -90 AND 90),
  CONSTRAINT "events_valid_longitude" CHECK ("longitude" BETWEEN -180 AND 180)
);
CREATE INDEX "events_status_start_idx" ON "events" ("status", "starts_at");
CREATE INDEX "events_attendance_window_idx" ON "events" ("attendance_opens_at", "attendance_closes_at");

CREATE TABLE "attendance_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL REFERENCES "events"("id"),
  "member_id" uuid NOT NULL REFERENCES "member_profiles"("id"),
  "status" "attendance_status" NOT NULL,
  "method" "attendance_method" NOT NULL,
  "checked_in_at" timestamptz NOT NULL,
  "latitude" numeric(9,6) NOT NULL,
  "longitude" numeric(9,6) NOT NULL,
  "accuracy_meters" numeric(10,2) NOT NULL,
  "distance_meters" numeric(10,2) NOT NULL,
  "within_geofence" boolean NOT NULL,
  "points_awarded" integer DEFAULT 10 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "attendance_event_member_unique" ON "attendance_records" ("event_id", "member_id");
CREATE INDEX "attendance_member_checked_in_idx" ON "attendance_records" ("member_id", "checked_in_at" DESC);
CREATE INDEX "attendance_event_status_idx" ON "attendance_records" ("event_id", "status");
