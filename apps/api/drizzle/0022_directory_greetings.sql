CREATE TABLE IF NOT EXISTS "directory_greetings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL REFERENCES "churches"("id"),
  "sender_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "recipient_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "directory_greetings_not_self" CHECK ("sender_user_id" <> "recipient_user_id")
);

CREATE INDEX IF NOT EXISTS "directory_greetings_sender_recipient_created_idx"
  ON "directory_greetings" ("sender_user_id", "recipient_user_id", "created_at");
