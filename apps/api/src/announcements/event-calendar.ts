/**
 * Calendar exports for informational church events: an .ics file (RFC 5545)
 * and an "Add to Google Calendar" link.
 *
 * Only shareable event details are exported: never member data, author
 * names, or tokens.
 */

export type CalendarEvent = {
  id: string;
  title: string;
  theme: string | null;
  description: string | null;
  locationName: string | null;
  onlineUrl: string | null;
  startsAt: Date;
  endsAt: Date | null;
  timeZone: string;
  cancelledAt: Date | null;
  revision: number;
  updatedAt: Date;
};

/** Used only for older events saved before an end time was required. */
const FALLBACK_DURATION_MS = 60 * 60 * 1000;
const UID_DOMAIN = 'arrows-acms';
const COPY_NOTE =
  'Added from the Arrows Church app. This is a copy: check the app for changes or cancellations.';

export function eventEnd(event: Pick<CalendarEvent, 'startsAt' | 'endsAt'>) {
  return event.endsAt && event.endsAt > event.startsAt
    ? event.endsAt
    : new Date(event.startsAt.getTime() + FALLBACK_DURATION_MS);
}

/** "20261205T180000Z" */
function utcStamp(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/** "Sat, 5 Dec 2026, 6:00 pm – 9:00 pm GMT (Africa/Accra)" */
export function describeEventTime(
  event: Pick<CalendarEvent, 'startsAt' | 'endsAt' | 'timeZone'>,
) {
  const end = eventEnd(event);
  const day = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: event.timeZone,
  });
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: event.timeZone,
  });
  const zoneName =
    new Intl.DateTimeFormat('en-GB', {
      timeZone: event.timeZone,
      timeZoneName: 'short',
    })
      .formatToParts(event.startsAt)
      .find((part) => part.type === 'timeZoneName')?.value ?? '';
  const sameDay = day.format(event.startsAt) === day.format(end);
  const endText = sameDay
    ? time.format(end)
    : `${day.format(end)}, ${time.format(end)}`;
  return `${day.format(event.startsAt)}, ${time.format(event.startsAt)} – ${endText} ${zoneName} (${event.timeZone})`.replace(
    /\s+/g,
    ' ',
  );
}

function detailsText(event: CalendarEvent, descriptionLimit = Infinity) {
  const description =
    event.description && event.description.length > descriptionLimit
      ? `${event.description.slice(0, descriptionLimit - 1)}…`
      : event.description;
  return [
    event.cancelledAt ? 'This event has been cancelled.' : null,
    event.theme ? `Theme: ${event.theme}` : null,
    description,
    event.onlineUrl ? `Join online: ${event.onlineUrl}` : null,
    `When: ${describeEventTime(event)}`,
    COPY_NOTE,
  ]
    .filter(Boolean)
    .join('\n\n');
}

function summaryText(event: CalendarEvent) {
  return event.cancelledAt ? `CANCELLED: ${event.title}` : event.title;
}

/** Escapes TEXT values (RFC 5545 §3.3.11). */
export function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Folds a content line so no physical line exceeds 75 octets (RFC 5545
 * §3.1), without splitting a multi-byte character.
 */
export function foldIcsLine(line: string) {
  const lines: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const character of line) {
    const bytes = Buffer.byteLength(character, 'utf8');
    // Continuation lines start with a space, which counts toward the limit.
    const limit = lines.length === 0 ? 75 : 74;
    if (currentBytes + bytes > limit) {
      lines.push(current);
      current = '';
      currentBytes = 0;
    }
    current += character;
    currentBytes += bytes;
  }
  lines.push(current);
  return lines.join('\r\n ');
}

export function buildEventIcs(event: CalendarEvent, now = new Date()) {
  const location = event.locationName ?? event.onlineUrl;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Arrows Church//ACMS Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-TIMEZONE:${event.timeZone}`,
    'BEGIN:VEVENT',
    `UID:${event.id}@${UID_DOMAIN}`,
    `DTSTAMP:${utcStamp(now)}`,
    `LAST-MODIFIED:${utcStamp(event.updatedAt)}`,
    `SEQUENCE:${event.revision}`,
    // UTC times are unambiguous in every client; the church timezone is
    // stated in X-WR-TIMEZONE and in the description.
    `DTSTART:${utcStamp(event.startsAt)}`,
    `DTEND:${utcStamp(eventEnd(event))}`,
    `SUMMARY:${escapeIcsText(summaryText(event))}`,
    `DESCRIPTION:${escapeIcsText(detailsText(event))}`,
    ...(location ? [`LOCATION:${escapeIcsText(location)}`] : []),
    ...(event.onlineUrl ? [`URL:${event.onlineUrl}`] : []),
    `STATUS:${event.cancelledAt ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}

/** A safe file name such as "youth-night-2026-12-05.ics". */
export function eventIcsFilename(
  event: Pick<CalendarEvent, 'title' | 'startsAt' | 'timeZone'>,
) {
  const slug =
    event.title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'church-event';
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: event.timeZone,
  }).format(event.startsAt);
  return `${slug}-${date}.ics`;
}

/** Keeps the Google link a safe length; the full text stays in ACMS. */
const GOOGLE_DESCRIPTION_LIMIT = 1000;

export function googleCalendarUrl(event: CalendarEvent) {
  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: summaryText(event),
    dates: `${utcStamp(event.startsAt)}/${utcStamp(eventEnd(event))}`,
    details: detailsText(event, GOOGLE_DESCRIPTION_LIMIT),
    ctz: event.timeZone,
  });
  const location = event.locationName ?? event.onlineUrl;
  if (location) query.set('location', location);
  return `https://calendar.google.com/calendar/render?${query}`;
}
