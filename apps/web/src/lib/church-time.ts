/** Times are entered and shown in the church's timezone, not the server's. */
export const CHURCH_TIME_ZONE = "Africa/Accra";

const WALL_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function wallTimeParts(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/**
 * Converts a `datetime-local` value ("2026-12-05T18:00") entered in the
 * church timezone to an ISO timestamp. Returns null for invalid input.
 */
export function churchWallTimeToIso(
  value: string,
  timeZone = CHURCH_TIME_ZONE,
): string | null {
  const match = WALL_TIME_PATTERN.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  // How far the zone's clock is from UTC at that moment.
  const shown = wallTimeParts(new Date(asUtc), timeZone);
  const offset =
    Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute) -
    asUtc;
  const result = new Date(asUtc - offset);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

/** Converts an ISO timestamp to a `datetime-local` value in the church timezone. */
export function isoToChurchWallTime(
  iso: string | null,
  timeZone = CHURCH_TIME_ZONE,
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const { year, month, day, hour, minute } = wallTimeParts(date, timeZone);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}
