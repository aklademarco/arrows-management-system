-- Feed moderation on posts: pinned notices and closed comment threads.
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS pinned_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS comments_closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS comments_closed_by uuid REFERENCES users(id);

ALTER TABLE announcements
  ADD CONSTRAINT announcements_pin_consistent
    CHECK ((pinned_at IS NULL) = (pinned_by IS NULL)),
  ADD CONSTRAINT announcements_comments_closed_consistent
    CHECK ((comments_closed_at IS NULL) = (comments_closed_by IS NULL));

CREATE INDEX IF NOT EXISTS announcements_feed_idx
  ON announcements(church_id, kind, pinned_at, created_at)
  WHERE archived_at IS NULL;

DO $$ BEGIN
  CREATE TYPE feed_reaction AS ENUM ('LIKE', 'AMEN', 'LOVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE comment_report_status AS ENUM ('OPEN', 'HIDDEN', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- One active reaction per member per post. Removing a reaction deletes the
-- row: reactions are not records the church needs to keep.
CREATE TABLE IF NOT EXISTS announcement_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id),
  announcement_id uuid NOT NULL REFERENCES announcements(id),
  user_id uuid NOT NULL REFERENCES users(id),
  reaction feed_reaction NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcement_reactions_one_per_member UNIQUE (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS announcement_reactions_post_idx
  ON announcement_reactions(announcement_id, reaction);

-- Comments are never deleted: authors soft-delete, moderators hide.
CREATE TABLE IF NOT EXISTS announcement_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id),
  announcement_id uuid NOT NULL REFERENCES announcements(id),
  author_user_id uuid NOT NULL REFERENCES users(id),
  body varchar(1000) NOT NULL,
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES users(id),
  hidden_at timestamptz,
  hidden_by uuid REFERENCES users(id),
  hidden_reason varchar(300),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcement_comments_body_not_blank
    CHECK (char_length(btrim(body)) > 0),
  CONSTRAINT announcement_comments_deleted_consistent
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),
  CONSTRAINT announcement_comments_hidden_consistent
    CHECK (
      (hidden_at IS NULL AND hidden_by IS NULL AND hidden_reason IS NULL)
      OR (hidden_at IS NOT NULL AND hidden_by IS NOT NULL AND hidden_reason IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS announcement_comments_thread_idx
  ON announcement_comments(announcement_id, created_at)
  WHERE deleted_at IS NULL AND hidden_at IS NULL;

CREATE TABLE IF NOT EXISTS announcement_comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id),
  comment_id uuid NOT NULL REFERENCES announcement_comments(id),
  reporter_user_id uuid NOT NULL REFERENCES users(id),
  reason varchar(300) NOT NULL,
  status comment_report_status NOT NULL DEFAULT 'OPEN',
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcement_comment_reports_once_per_member
    UNIQUE (comment_id, reporter_user_id),
  CONSTRAINT announcement_comment_reports_reason_not_blank
    CHECK (char_length(btrim(reason)) > 0),
  CONSTRAINT announcement_comment_reports_resolution_consistent
    CHECK (
      (status = 'OPEN' AND resolved_by IS NULL AND resolved_at IS NULL)
      OR (status <> 'OPEN' AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS announcement_comment_reports_queue_idx
  ON announcement_comment_reports(church_id, status, created_at);
