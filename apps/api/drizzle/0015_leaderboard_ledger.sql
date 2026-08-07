CREATE TYPE "leaderboard_subject_type" AS ENUM ('MEMBER', 'DEPARTMENT');

CREATE TABLE "leaderboard_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subject_type" "leaderboard_subject_type" NOT NULL,
  "member_id" uuid REFERENCES "member_profiles"("id"),
  "department_id" uuid REFERENCES "departments"("id"),
  "event_id" uuid REFERENCES "events"("id"),
  "points" integer NOT NULL,
  "reason" varchar(180) NOT NULL,
  "occurred_at" timestamptz NOT NULL,
  "voided_at" timestamptz,
  "voided_by" uuid REFERENCES "users"("id"),
  "void_reason" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "leaderboard_entries_one_subject" CHECK (("subject_type" = 'MEMBER' AND "member_id" IS NOT NULL AND "department_id" IS NULL) OR ("subject_type" = 'DEPARTMENT' AND "department_id" IS NOT NULL AND "member_id" IS NULL)),
  CONSTRAINT "leaderboard_entries_void_metadata" CHECK (("voided_at" IS NULL AND "voided_by" IS NULL AND "void_reason" IS NULL) OR ("voided_at" IS NOT NULL AND "void_reason" IS NOT NULL AND char_length(btrim("void_reason")) > 0))
);
CREATE INDEX "leaderboard_entries_member_period_idx" ON "leaderboard_entries" ("member_id", "occurred_at");
CREATE INDEX "leaderboard_entries_department_period_idx" ON "leaderboard_entries" ("department_id", "occurred_at");
CREATE UNIQUE INDEX "leaderboard_entries_attendance_reward_unique" ON "leaderboard_entries" ("member_id", "event_id", "reason") WHERE "reason" = 'VALID_ATTENDANCE';

CREATE FUNCTION sync_attendance_leaderboard_reward() RETURNS trigger AS $$
DECLARE event_time timestamptz;
BEGIN
  SELECT starts_at INTO event_time FROM events WHERE id = NEW.event_id;
  INSERT INTO leaderboard_entries (subject_type, member_id, event_id, points, reason, occurred_at, voided_at, void_reason)
  VALUES ('MEMBER', NEW.member_id, NEW.event_id, 10, 'VALID_ATTENDANCE', event_time,
    CASE WHEN NEW.points_awarded > 0 THEN NULL ELSE now() END,
    CASE WHEN NEW.points_awarded > 0 THEN NULL ELSE 'Attendance outcome is not point-bearing.' END)
  ON CONFLICT (member_id, event_id, reason) WHERE reason = 'VALID_ATTENDANCE'
  DO UPDATE SET points = 10,
    voided_at = CASE WHEN NEW.points_awarded > 0 THEN NULL ELSE now() END,
    void_reason = CASE WHEN NEW.points_awarded > 0 THEN NULL ELSE 'Attendance outcome is not point-bearing.' END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_leaderboard_reward_sync
AFTER INSERT OR UPDATE OF points_awarded ON attendance_records
FOR EACH ROW EXECUTE FUNCTION sync_attendance_leaderboard_reward();

INSERT INTO leaderboard_entries (subject_type, member_id, event_id, points, reason, occurred_at, voided_at, void_reason)
SELECT 'MEMBER', ar.member_id, ar.event_id, 10, 'VALID_ATTENDANCE', e.starts_at,
  CASE WHEN ar.points_awarded > 0 THEN NULL ELSE now() END,
  CASE WHEN ar.points_awarded > 0 THEN NULL ELSE 'Attendance outcome is not point-bearing.' END
FROM attendance_records ar JOIN events e ON e.id = ar.event_id
ON CONFLICT DO NOTHING;
