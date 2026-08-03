ALTER TABLE "events" ADD COLUMN "cancelled_at" timestamptz;
ALTER TABLE "events" ADD COLUMN "cancelled_by" uuid REFERENCES "users"("id");
ALTER TABLE "events" ADD COLUMN "cancellation_reason" text;
ALTER TABLE "events" ADD CONSTRAINT "events_valid_cancellation_metadata" CHECK (
  ("status" = 'CANCELLED' AND "cancelled_at" IS NOT NULL AND "cancelled_by" IS NOT NULL
    AND "cancellation_reason" IS NOT NULL
    AND char_length(btrim("cancellation_reason")) BETWEEN 3 AND 1000)
  OR
  ("status" <> 'CANCELLED' AND "cancelled_at" IS NULL AND "cancelled_by" IS NULL
    AND "cancellation_reason" IS NULL)
);
