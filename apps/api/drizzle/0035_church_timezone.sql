-- Align fresh databases with the existing Drizzle church schema.
ALTER TABLE churches ADD COLUMN IF NOT EXISTS timezone varchar(60) NOT NULL DEFAULT 'Africa/Accra';
