import {
  buildEventIcs,
  describeEventTime,
  escapeIcsText,
  eventIcsFilename,
  foldIcsLine,
  googleCalendarUrl,
  type CalendarEvent,
} from './event-calendar';

const event: CalendarEvent = {
  id: '6f4c7333-098b-4a0f-9a48-cc6c5c345be9',
  title: 'Youth Night',
  theme: 'Rooted, grounded; growing',
  description: 'Worship\nand prayer.',
  locationName: 'Main auditorium',
  onlineUrl: null,
  startsAt: new Date('2026-12-05T18:00:00Z'),
  endsAt: new Date('2026-12-05T21:00:00Z'),
  timeZone: 'Africa/Accra',
  cancelledAt: null,
  revision: 2,
  updatedAt: new Date('2026-11-20T08:30:00Z'),
};

/** Unfolds an .ics file back into logical content lines. */
function contentLines(ics: string) {
  return ics.replace(/\r\n /g, '').split('\r\n');
}

describe('event calendar export', () => {
  it('escapes calendar text', () => {
    expect(escapeIcsText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
  });

  it('folds long lines at 75 octets without splitting characters', () => {
    const line = `DESCRIPTION:${'é'.repeat(80)}`;
    const folded = foldIcsLine(line);
    for (const physical of folded.split('\r\n')) {
      expect(Buffer.byteLength(physical, 'utf8')).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, '')).toBe(line);
  });

  it('builds a stable, revisioned event in UTC', () => {
    const ics = buildEventIcs(event, new Date('2026-11-21T00:00:00Z'));
    const lines = contentLines(ics);

    expect(ics.endsWith('\r\n')).toBe(true);
    expect(lines).toEqual(
      expect.arrayContaining([
        'BEGIN:VCALENDAR',
        'METHOD:PUBLISH',
        'X-WR-TIMEZONE:Africa/Accra',
        `UID:${event.id}@arrows-acms`,
        'DTSTAMP:20261121T000000Z',
        'LAST-MODIFIED:20261120T083000Z',
        'SEQUENCE:2',
        'DTSTART:20261205T180000Z',
        'DTEND:20261205T210000Z',
        'SUMMARY:Youth Night',
        'LOCATION:Main auditorium',
        'STATUS:CONFIRMED',
      ]),
    );
    const description = lines.find((line) => line.startsWith('DESCRIPTION:'));
    expect(description).toContain('Theme: Rooted\\, grounded\\; growing');
    expect(description).toContain('Worship\\nand prayer.');
    expect(description).toContain('GMT (Africa/Accra)');
    expect(description).toContain('This is a copy');
  });

  it('marks cancelled events', () => {
    const lines = contentLines(
      buildEventIcs({
        ...event,
        cancelledAt: new Date('2026-11-22T00:00:00Z'),
      }),
    );
    expect(lines).toContain('STATUS:CANCELLED');
    expect(lines).toContain('SUMMARY:CANCELLED: Youth Night');
  });

  it('uses the online link as the location when there is no venue', () => {
    const lines = contentLines(
      buildEventIcs({
        ...event,
        locationName: null,
        onlineUrl: 'https://youtube.com/live/abc',
      }),
    );
    expect(lines).toContain('LOCATION:https://youtube.com/live/abc');
    expect(lines).toContain('URL:https://youtube.com/live/abc');
  });

  it('gives older events without an end time a one-hour slot', () => {
    const lines = contentLines(buildEventIcs({ ...event, endsAt: null }));
    expect(lines).toContain('DTEND:20261205T190000Z');
  });

  it('describes the time in the church timezone', () => {
    expect(describeEventTime(event)).toBe(
      'Sat, 5 Dec 2026, 6:00 pm – 9:00 pm GMT (Africa/Accra)',
    );
  });

  it('creates a safe file name dated in the church timezone', () => {
    expect(
      eventIcsFilename({ ...event, title: 'Carols & Lessons: 2026!' }),
    ).toBe('carols-lessons-2026-2026-12-05.ics');
  });

  it('builds a Google Calendar template link', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.origin + url.pathname).toBe(
      'https://calendar.google.com/calendar/render',
    );
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Youth Night');
    expect(url.searchParams.get('dates')).toBe(
      '20261205T180000Z/20261205T210000Z',
    );
    expect(url.searchParams.get('ctz')).toBe('Africa/Accra');
    expect(url.searchParams.get('location')).toBe('Main auditorium');
    expect(url.searchParams.get('details')).toContain('This is a copy');
  });

  it('keeps the copy note when a long description is shortened', () => {
    const url = new URL(
      googleCalendarUrl({ ...event, description: 'x'.repeat(5000) }),
    );
    const details = url.searchParams.get('details') ?? '';
    expect(details.length).toBeLessThan(1500);
    expect(details).toContain('This is a copy');
  });
});
