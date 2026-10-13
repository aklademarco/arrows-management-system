CREATE TABLE push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id),
  user_id uuid NOT NULL REFERENCES users(id),
  token varchar(4096) NOT NULL,
  token_hash varchar(64) NOT NULL,
  revoked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX push_devices_token_hash_idx ON push_devices(token_hash);
CREATE INDEX push_devices_recipient_idx ON push_devices(church_id, user_id);
