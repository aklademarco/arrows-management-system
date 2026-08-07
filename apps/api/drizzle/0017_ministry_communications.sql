DO $$ BEGIN CREATE TYPE ministry_content_type AS ENUM ('PUBLICITY_FLYER', 'SONG_LIST'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ministry_content_status AS ENUM ('DRAFT', 'SENT', 'ACKNOWLEDGED', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE message_audience AS ENUM ('CHURCH', 'DEPARTMENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE sms_delivery_status AS ENUM ('NOT_REQUESTED', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE liturgy_item_status AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'SKIPPED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS ministry_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), church_id uuid NOT NULL REFERENCES churches(id), sender_user_id uuid NOT NULL REFERENCES users(id), event_id uuid REFERENCES events(id), target_department_id uuid NOT NULL REFERENCES departments(id), type ministry_content_type NOT NULL, status ministry_content_status NOT NULL DEFAULT 'DRAFT', title varchar(180) NOT NULL, instructions text, deadline_at timestamptz, sent_at timestamptz, acknowledged_at timestamptz, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ministry_content_title_not_blank CHECK (char_length(btrim(title)) > 0)
);
CREATE INDEX IF NOT EXISTS ministry_content_target_status_idx ON ministry_content(target_department_id, status, created_at);
CREATE INDEX IF NOT EXISTS ministry_content_event_idx ON ministry_content(event_id);

CREATE TABLE IF NOT EXISTS ministry_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_id uuid NOT NULL REFERENCES ministry_content(id), cloudinary_url text NOT NULL, cloudinary_public_id varchar(255) NOT NULL, file_name varchar(255) NOT NULL, mime_type varchar(100) NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ministry_attachments_content_idx ON ministry_attachments(content_id);

CREATE TABLE IF NOT EXISTS ministry_song_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_id uuid NOT NULL REFERENCES ministry_content(id), position integer NOT NULL, title varchar(180) NOT NULL, lyrics text, musical_key varchar(30), notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ministry_song_position_positive CHECK (position > 0), CONSTRAINT ministry_song_title_not_blank CHECK (char_length(btrim(title)) > 0), UNIQUE(content_id, position)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), church_id uuid NOT NULL REFERENCES churches(id), recipient_user_id uuid NOT NULL REFERENCES users(id), actor_user_id uuid REFERENCES users(id), type varchar(100) NOT NULL, title varchar(180) NOT NULL, body text NOT NULL, link text, ministry_content_id uuid REFERENCES ministry_content(id), read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_title_not_blank CHECK (char_length(btrim(title)) > 0)
);
CREATE INDEX IF NOT EXISTS notifications_recipient_read_idx ON notifications(recipient_user_id, read_at, created_at);

CREATE TABLE IF NOT EXISTS leadership_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), church_id uuid NOT NULL REFERENCES churches(id), sender_user_id uuid NOT NULL REFERENCES users(id), audience message_audience NOT NULL, title varchar(180) NOT NULL, body text NOT NULL, sms_requested boolean NOT NULL DEFAULT false, sent_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leadership_messages_content_not_blank CHECK (char_length(btrim(title)) > 0 AND char_length(btrim(body)) > 0)
);
CREATE TABLE IF NOT EXISTS leadership_message_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), message_id uuid NOT NULL REFERENCES leadership_messages(id), department_id uuid NOT NULL REFERENCES departments(id), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(message_id, department_id)
);
CREATE TABLE IF NOT EXISTS leadership_message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), message_id uuid NOT NULL REFERENCES leadership_messages(id), recipient_user_id uuid NOT NULL REFERENCES users(id), phone_snapshot varchar(30), read_at timestamptz, sms_status sms_delivery_status NOT NULL DEFAULT 'NOT_REQUESTED', sms_provider_id varchar(255), sms_attempted_at timestamptz, sms_delivered_at timestamptz, sms_failure_reason text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(message_id, recipient_user_id)
);
CREATE INDEX IF NOT EXISTS leadership_message_recipient_idx ON leadership_message_recipients(recipient_user_id, read_at, created_at);
CREATE INDEX IF NOT EXISTS leadership_message_sms_idx ON leadership_message_recipients(sms_status, created_at);

CREATE TABLE IF NOT EXISTS liturgy_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), church_id uuid NOT NULL REFERENCES churches(id), name varchar(180) NOT NULL, description text, is_default boolean NOT NULL DEFAULT false, is_active boolean NOT NULL DEFAULT true, created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT liturgy_template_name_not_blank CHECK (char_length(btrim(name)) > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS liturgy_templates_one_default_idx ON liturgy_templates(church_id) WHERE is_default = true AND is_active = true;
CREATE TABLE IF NOT EXISTS liturgy_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), template_id uuid NOT NULL REFERENCES liturgy_templates(id), position integer NOT NULL, title varchar(180) NOT NULL, planned_offset_minutes integer NOT NULL, planned_duration_minutes integer NOT NULL, owner_label varchar(120), notes text, show_on_projection boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT liturgy_template_item_values CHECK (position > 0 AND planned_offset_minutes >= 0 AND planned_duration_minutes > 0), UNIQUE(template_id, position)
);

CREATE TABLE IF NOT EXISTS event_liturgies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL UNIQUE REFERENCES events(id), source_template_id uuid REFERENCES liturgy_templates(id), preacher_name varchar(180), sermon_title varchar(255), preacher_image_url text, preacher_image_public_id varchar(255), projection_enabled boolean NOT NULL DEFAULT true, started_at timestamptz, completed_at timestamptz, created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS event_liturgy_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), liturgy_id uuid NOT NULL REFERENCES event_liturgies(id), position integer NOT NULL, title varchar(180) NOT NULL, planned_start_at timestamptz NOT NULL, planned_duration_minutes integer NOT NULL, owner_label varchar(120), notes text, show_on_projection boolean NOT NULL DEFAULT true, status liturgy_item_status NOT NULL DEFAULT 'PENDING', actual_started_at timestamptz, paused_at timestamptz, accumulated_pause_seconds integer NOT NULL DEFAULT 0, actual_completed_at timestamptz, skipped_at timestamptz, timing_updated_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT event_liturgy_item_values CHECK (position > 0 AND planned_duration_minutes > 0 AND accumulated_pause_seconds >= 0), UNIQUE(liturgy_id, position)
);
CREATE INDEX IF NOT EXISTS event_liturgy_items_live_idx ON event_liturgy_items(liturgy_id, status, position);
