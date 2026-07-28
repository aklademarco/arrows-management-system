ALTER TABLE "users"
  ADD COLUMN "last_login_at" timestamptz,
  ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL,
  ADD COLUMN "locked_until" timestamptz;

CREATE TABLE "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(50) NOT NULL UNIQUE,
  "description" varchar(255)
);

CREATE TABLE "user_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "role_id" uuid NOT NULL REFERENCES "roles"("id"),
  "assigned_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "user_roles_user_role_unique"
  ON "user_roles" ("user_id", "role_id");
CREATE INDEX "user_roles_user_idx" ON "user_roles" ("user_id");

INSERT INTO "roles" ("name", "description")
VALUES
  ('SUPER_ADMIN', 'Full system administration'),
  ('ADMIN', 'Church administration'),
  ('DEPARTMENT_LEADER', 'Department-scoped leadership'),
  ('ATTENDANCE_OFFICER', 'Attendance administration'),
  ('MEMBER', 'Standard member access')
ON CONFLICT ("name") DO NOTHING;
