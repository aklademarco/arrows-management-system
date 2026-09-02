const ACCRA_TIME_ZONE = 'Africa/Accra';

function accraDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACCRA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function sundayAttendanceWindow(startsAt: Date, endsAt: Date) {
  const parts = accraDateParts(startsAt);
  if (parts.weekday !== 'Sun') return null;

  return {
    // Ghana currently observes GMT year-round, so local midnight is UTC midnight.
    opensAt: new Date(
      `${parts.year}-${parts.month}-${parts.day}T00:00:00.000Z`,
    ),
    closesAt: endsAt,
  };
}
