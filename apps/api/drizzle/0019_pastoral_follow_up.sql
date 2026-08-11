DO $$ BEGIN
  CREATE TYPE "pastoral_follow_up_method" AS ENUM ('CALL', 'MESSAGE', 'VISIT', 'IN_PERSON', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "pastoral_follow_up_outcome" AS ENUM ('NO_RESPONSE', 'REACHED', 'NEEDS_PRAYER', 'NEEDS_VISIT', 'SICK', 'TRAVELLING', 'RETURNING_SOON', 'CARE_COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "pastoral_follow_ups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL REFERENCES "churches"("id"),
  "member_id" uuid NOT NULL REFERENCES "member_profiles"("id"),
  "contacted_by" uuid NOT NULL REFERENCES "users"("id"),
  "method" "pastoral_follow_up_method" NOT NULL,
  "outcome" "pastoral_follow_up_outcome" NOT NULL,
  "notes" text,
  "contacted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "next_follow_up_on" date,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "pastoral_follow_ups_church_contacted_idx" ON "pastoral_follow_ups" ("church_id", "contacted_at");
CREATE INDEX IF NOT EXISTS "pastoral_follow_ups_member_contacted_idx" ON "pastoral_follow_ups" ("member_id", "contacted_at");
