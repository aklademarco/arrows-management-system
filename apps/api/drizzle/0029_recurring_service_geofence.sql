ALTER TABLE recurring_service_templates
  ADD COLUMN IF NOT EXISTS location_name varchar(180),
  ADD COLUMN IF NOT EXISTS latitude numeric(9, 6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9, 6),
  ADD COLUMN IF NOT EXISTS geofence_radius_meters integer,
  ADD COLUMN IF NOT EXISTS maximum_accuracy_meters integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id);

WITH latest_event AS (
  SELECT DISTINCT ON (event.church_id)
    event.church_id,
    event.location_name,
    event.latitude,
    event.longitude,
    event.geofence_radius_meters,
    event.maximum_accuracy_meters,
    event.created_by
  FROM events AS event
  ORDER BY event.church_id, event.starts_at DESC
)
UPDATE recurring_service_templates AS template
SET
  location_name = COALESCE(template.location_name, source.location_name),
  latitude = COALESCE(template.latitude, source.latitude),
  longitude = COALESCE(template.longitude, source.longitude),
  geofence_radius_meters = COALESCE(
    template.geofence_radius_meters,
    source.geofence_radius_meters
  ),
  maximum_accuracy_meters = COALESCE(
    template.maximum_accuracy_meters,
    source.maximum_accuracy_meters,
    50
  ),
  created_by = COALESCE(template.created_by, source.created_by),
  updated_at = now()
FROM latest_event AS source
WHERE source.church_id = template.church_id
  AND (
    template.location_name IS NULL
  OR template.latitude IS NULL
  OR template.longitude IS NULL
  OR template.geofence_radius_meters IS NULL
  OR template.created_by IS NULL
  );

ALTER TABLE recurring_service_templates
  DROP CONSTRAINT IF EXISTS recurring_service_geofence_radius_positive;

ALTER TABLE recurring_service_templates
  ADD CONSTRAINT recurring_service_geofence_radius_positive
  CHECK (geofence_radius_meters IS NULL OR geofence_radius_meters > 0);
