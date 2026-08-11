ALTER TABLE "member_profiles"
  ADD COLUMN IF NOT EXISTS "directory_phone_visible" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "skills" text[] DEFAULT '{}'::text[] NOT NULL;
