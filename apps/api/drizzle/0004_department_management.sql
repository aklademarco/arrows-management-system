ALTER TABLE "departments"
  ADD COLUMN "slug" varchar(120),
  ADD COLUMN "description" text,
  ADD COLUMN "is_active" boolean DEFAULT true NOT NULL,
  ADD COLUMN "created_at" timestamptz DEFAULT now() NOT NULL,
  ADD COLUMN "updated_at" timestamptz DEFAULT now() NOT NULL;

UPDATE "departments"
SET "slug" =
  trim(both '-' from lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g')))
  || '-' || left("id"::text, 8);

ALTER TABLE "departments" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "departments_church_slug_unique"
  ON "departments" ("church_id", "slug");
