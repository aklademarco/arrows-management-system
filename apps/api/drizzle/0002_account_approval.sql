CREATE TYPE "review_decision" AS ENUM ('APPROVED', 'REJECTED');

CREATE TABLE "account_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "reviewed_by" uuid NOT NULL REFERENCES "users"("id"),
  "previous_status" "account_status" NOT NULL,
  "new_status" "account_status" NOT NULL,
  "decision" "review_decision" NOT NULL,
  "reason" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL REFERENCES "churches"("id"),
  "actor_user_id" uuid REFERENCES "users"("id"),
  "action" varchar(120) NOT NULL,
  "entity_type" varchar(100) NOT NULL,
  "entity_id" uuid,
  "previous_data" jsonb,
  "new_data" jsonb,
  "metadata" jsonb,
  "ip_address" inet,
  "user_agent" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "audit_logs_actor_created_idx"
  ON "audit_logs" ("actor_user_id", "created_at" DESC);
CREATE INDEX "audit_logs_entity_idx"
  ON "audit_logs" ("entity_type", "entity_id");
