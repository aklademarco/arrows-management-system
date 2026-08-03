ALTER TABLE "events" ADD COLUMN "attendance_finalized_at" timestamptz;
ALTER TABLE "events" ADD COLUMN "attendance_finalized_by" uuid REFERENCES "users"("id");
ALTER TABLE "attendance_records" ALTER COLUMN "checked_in_at" DROP NOT NULL;
