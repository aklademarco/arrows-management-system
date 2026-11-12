DO $$ BEGIN
  CREATE TYPE announcement_kind AS ENUM ('ANNOUNCEMENT', 'EVENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Church announcements and events that do not track attendance.
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id),
  kind announcement_kind NOT NULL,
  title varchar(180) NOT NULL,
  theme varchar(180),
  description varchar(2000),
  location_name varchar(200),
  starts_at timestamptz,
  ends_at timestamptz,
  flyer_url text,
  flyer_public_id varchar(255),
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid NOT NULL REFERENCES users(id),
  archived_at timestamptz,
  archived_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcements_title_not_blank
    CHECK (char_length(btrim(title)) > 0),
  CONSTRAINT announcements_event_has_date
    CHECK (kind <> 'EVENT' OR starts_at IS NOT NULL),
  CONSTRAINT announcements_ends_after_start
    CHECK (ends_at IS NULL OR (starts_at IS NOT NULL AND ends_at >= starts_at)),
  CONSTRAINT announcements_flyer_complete
    CHECK ((flyer_url IS NULL) = (flyer_public_id IS NULL)),
  CONSTRAINT announcements_archive_consistent
    CHECK ((archived_at IS NULL) = (archived_by IS NULL))
);

CREATE INDEX IF NOT EXISTS announcements_church_starts_idx
  ON announcements(church_id, starts_at)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS announcements_church_created_idx
  ON announcements(church_id, created_at)
  WHERE archived_at IS NULL;
