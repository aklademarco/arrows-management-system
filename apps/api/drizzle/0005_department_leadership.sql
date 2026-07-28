CREATE TABLE "department_leaders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "department_id" uuid NOT NULL REFERENCES "departments"("id"),
  "member_id" uuid NOT NULL REFERENCES "member_profiles"("id"),
  "title" varchar(100),
  "starts_at" date NOT NULL,
  "ends_at" date,
  "revoked_at" timestamptz,
  "revoked_by" uuid REFERENCES "users"("id"),
  "revocation_reason" text,
  "assigned_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "department_leaders_valid_date_range"
    CHECK ("ends_at" IS NULL OR "ends_at" >= "starts_at"),
  CONSTRAINT "department_leaders_valid_revocation"
    CHECK (
      ("revoked_at" IS NULL AND "revoked_by" IS NULL AND "revocation_reason" IS NULL)
      OR
      ("revoked_at" IS NOT NULL AND "revoked_by" IS NOT NULL
        AND "revocation_reason" IS NOT NULL
        AND char_length(btrim("revocation_reason")) > 0)
    )
);

CREATE UNIQUE INDEX "department_leaders_assignment_unique"
  ON "department_leaders" ("department_id", "member_id", "starts_at");
CREATE INDEX "department_leaders_member_dates_idx"
  ON "department_leaders" ("member_id", "revoked_at", "starts_at", "ends_at");
CREATE INDEX "department_leaders_department_dates_idx"
  ON "department_leaders" ("department_id", "revoked_at", "starts_at", "ends_at");
