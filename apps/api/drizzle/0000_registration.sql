CREATE TYPE "account_status" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "membership_status" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'ARCHIVED');
CREATE TYPE "account_action_token_type" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

CREATE TABLE "churches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(150) NOT NULL,
  "slug" varchar(100) NOT NULL UNIQUE
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL REFERENCES "churches"("id"),
  "email" varchar(255) NOT NULL,
  "phone" varchar(30),
  "password_hash" text NOT NULL,
  "account_status" "account_status" DEFAULT 'PENDING_APPROVAL' NOT NULL,
  "email_verified_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "users_email_unique" ON "users" (lower("email"));
CREATE UNIQUE INDEX "users_phone_unique" ON "users" ("phone") WHERE "phone" IS NOT NULL;
CREATE INDEX "users_account_status_idx" ON "users" ("account_status");

CREATE TABLE "departments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL REFERENCES "churches"("id"),
  "name" varchar(120) NOT NULL
);

CREATE TABLE "member_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id"),
  "first_name" varchar(100) NOT NULL,
  "last_name" varchar(100) NOT NULL,
  "other_names" varchar(150),
  "requested_department_id" uuid REFERENCES "departments"("id"),
  "membership_status" "membership_status" DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE "account_action_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "type" "account_action_token_type" NOT NULL,
  "token_hash" varchar(64) NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "revoked_at" timestamptz,
  "requested_ip" inet,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX "account_action_tokens_user_type_idx"
  ON "account_action_tokens" ("user_id", "type", "created_at" DESC);

INSERT INTO "churches" ("id", "name", "slug")
VALUES ('00000000-0000-4000-8000-000000000001', 'Arrows Church', 'arrows-church')
ON CONFLICT ("slug") DO NOTHING;
