import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ANNOUNCEMENT_PORTALS, type AnnouncementPortal } from "./announcements";
import { isUuid } from "./feed";

/**
 * Streams an event's .ics file from the API using the portal's session.
 * The file holds only shareable event details.
 */
export async function proxyEventCalendar(
  request: Request,
  portal: AnnouncementPortal,
  id: string,
) {
  const { cookie, loginPath } = ANNOUNCEMENT_PORTALS[portal];
  const token = (await cookies()).get(cookie)?.value;
  if (!token) return NextResponse.redirect(new URL(loginPath, request.url));
  if (!isUuid(id)) {
    return NextResponse.json({ message: "Event not found." }, { status: 404 });
  }

  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/announcements/${id}/calendar.ics`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }
  if (!response.ok) {
    return NextResponse.json(
      { message: "The calendar file could not be created." },
      { status: response.status === 404 ? 404 : 502 },
    );
  }

  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition":
        response.headers.get("content-disposition") ??
        'attachment; filename="church-event.ics"',
      "Cache-Control": "no-store",
    },
  });
}
