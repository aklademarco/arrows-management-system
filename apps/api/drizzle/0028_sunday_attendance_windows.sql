UPDATE events
SET
  attendance_opens_at = (
    date_trunc('day', starts_at AT TIME ZONE 'Africa/Accra')
    AT TIME ZONE 'Africa/Accra'
  ),
  attendance_closes_at = ends_at,
  updated_at = now()
WHERE EXTRACT(ISODOW FROM starts_at AT TIME ZONE 'Africa/Accra') = 7
  AND status IN ('SCHEDULED', 'ACTIVE')
  AND attendance_finalized_at IS NULL;
