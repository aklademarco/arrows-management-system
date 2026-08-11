ALTER TABLE "member_profiles"
  ADD COLUMN IF NOT EXISTS "directory_bio" varchar(300),
  ADD COLUMN IF NOT EXISTS "directory_visible" boolean DEFAULT true NOT NULL;
