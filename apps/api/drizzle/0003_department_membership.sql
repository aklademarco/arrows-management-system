CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE "department_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "department_id" uuid NOT NULL REFERENCES "departments"("id"),
  "member_id" uuid NOT NULL REFERENCES "member_profiles"("id"),
  "joined_at" date NOT NULL,
  "left_at" date,
  "assigned_by" uuid REFERENCES "users"("id"),
  "ended_by" uuid REFERENCES "users"("id"),
  "end_reason" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "department_members_valid_date_range"
    CHECK ("left_at" IS NULL OR "left_at" > "joined_at"),
  CONSTRAINT "department_members_valid_end_metadata" CHECK (
    ("left_at" IS NULL AND "ended_by" IS NULL AND "end_reason" IS NULL)
    OR
    ("left_at" IS NOT NULL AND "ended_by" IS NOT NULL AND "end_reason" IS NOT NULL AND char_length(btrim("end_reason")) > 0)
  ),
  CONSTRAINT "department_members_no_overlap" EXCLUDE USING gist (
    "department_id" WITH =,
    "member_id" WITH =,
    daterange("joined_at", "left_at", '[)') WITH &&
  )
);
CREATE INDEX "department_members_department_member_dates_idx"
  ON "department_members" ("department_id", "member_id", "joined_at", "left_at");
CREATE INDEX "department_members_member_idx" ON "department_members" ("member_id");

CREATE TABLE "primary_department_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL REFERENCES "member_profiles"("id"),
  "department_membership_id" uuid NOT NULL REFERENCES "department_members"("id"),
  "starts_at" date NOT NULL,
  "ends_at" date,
  "assigned_by" uuid NOT NULL REFERENCES "users"("id"),
  "ended_by" uuid REFERENCES "users"("id"),
  "end_reason" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "primary_department_assignments_valid_date_range"
    CHECK ("ends_at" IS NULL OR "ends_at" >= "starts_at"),
  CONSTRAINT "primary_department_assignments_valid_end_metadata" CHECK (
    ("ends_at" IS NULL AND "ended_by" IS NULL AND "end_reason" IS NULL)
    OR
    ("ends_at" IS NOT NULL AND "ended_by" IS NOT NULL AND "end_reason" IS NOT NULL AND char_length(btrim("end_reason")) > 0)
  ),
  CONSTRAINT "primary_department_assignments_no_overlap" EXCLUDE USING gist (
    "member_id" WITH =,
    daterange("starts_at", "ends_at", '[)') WITH &&
  )
);
CREATE INDEX "primary_department_assignments_member_dates_idx"
  ON "primary_department_assignments" ("member_id", "starts_at", "ends_at");
CREATE INDEX "primary_department_assignments_membership_idx"
  ON "primary_department_assignments" ("department_membership_id");

CREATE FUNCTION validate_primary_department_assignment() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  membership "department_members"%ROWTYPE;
BEGIN
  SELECT * INTO membership
  FROM "department_members"
  WHERE "id" = NEW."department_membership_id";

  IF membership."member_id" <> NEW."member_id" THEN
    RAISE EXCEPTION 'Primary assignment and membership must belong to the same member';
  END IF;
  IF NEW."starts_at" < membership."joined_at"
    OR (membership."left_at" IS NOT NULL AND (NEW."ends_at" IS NULL OR NEW."ends_at" > membership."left_at")) THEN
    RAISE EXCEPTION 'Primary assignment must be contained by its membership period';
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER "primary_department_assignment_membership_check"
AFTER INSERT OR UPDATE ON "primary_department_assignments"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION validate_primary_department_assignment();
