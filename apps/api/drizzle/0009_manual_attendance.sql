ALTER TABLE "attendance_records" ALTER COLUMN "latitude" DROP NOT NULL;
ALTER TABLE "attendance_records" ALTER COLUMN "longitude" DROP NOT NULL;
ALTER TABLE "attendance_records" ALTER COLUMN "accuracy_meters" DROP NOT NULL;
ALTER TABLE "attendance_records" ALTER COLUMN "distance_meters" DROP NOT NULL;
ALTER TABLE "attendance_records" ALTER COLUMN "within_geofence" DROP NOT NULL;
ALTER TABLE "attendance_records" ADD COLUMN "marked_by" uuid REFERENCES "users"("id");
ALTER TABLE "attendance_records" ADD COLUMN "manual_reason" text;
ALTER TABLE "attendance_records" ADD COLUMN "review_note" text;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_valid_method_evidence" CHECK (
  ("method" = 'GEOLOCATION' AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
    AND "accuracy_meters" IS NOT NULL AND "distance_meters" IS NOT NULL
    AND "within_geofence" = true AND "marked_by" IS NULL AND "manual_reason" IS NULL)
  OR
  ("method" = 'MANUAL' AND "latitude" IS NULL AND "longitude" IS NULL
    AND "accuracy_meters" IS NULL AND "distance_meters" IS NULL
    AND "within_geofence" IS NULL AND "marked_by" IS NOT NULL
    AND "manual_reason" IS NOT NULL AND char_length(btrim("manual_reason")) BETWEEN 3 AND 1000)
  OR
  ("method" = 'SYSTEM' AND "latitude" IS NULL AND "longitude" IS NULL
    AND "accuracy_meters" IS NULL AND "distance_meters" IS NULL
    AND "within_geofence" IS NULL AND "marked_by" IS NULL AND "manual_reason" IS NULL)
);
