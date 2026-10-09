DO $$ BEGIN
  CREATE TYPE pastoral_care_request_type AS ENUM ('MESSAGE', 'PRAYER_REQUEST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pastoral_care_request_status AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS pastoral_care_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id),
  member_id uuid NOT NULL REFERENCES member_profiles(id),
  type pastoral_care_request_type NOT NULL,
  subject varchar(160) NOT NULL,
  body text NOT NULL,
  status pastoral_care_request_status NOT NULL DEFAULT 'NEW',
  handled_by uuid REFERENCES users(id),
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pastoral_care_requests_subject_not_blank
    CHECK (char_length(btrim(subject)) > 0),
  CONSTRAINT pastoral_care_requests_body_not_blank
    CHECK (char_length(btrim(body)) > 0),
  CONSTRAINT pastoral_care_requests_handler_consistent
    CHECK (
      (status = 'NEW' AND handled_by IS NULL AND handled_at IS NULL)
      OR
      (status <> 'NEW' AND handled_by IS NOT NULL AND handled_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS pastoral_care_requests_church_status_created_idx
  ON pastoral_care_requests(church_id, status, created_at);

CREATE INDEX IF NOT EXISTS pastoral_care_requests_member_created_idx
  ON pastoral_care_requests(member_id, created_at);
