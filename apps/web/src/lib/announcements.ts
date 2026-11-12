import { CHURCH_TIME_ZONE } from "./church-time";

export type AnnouncementKind = "ANNOUNCEMENT" | "EVENT";

export type Announcement = {
  id: string;
  kind: AnnouncementKind;
  title: string;
  theme: string | null;
  description: string | null;
  locationName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  flyerUrl: string | null;
  authorName: string | null;
  createdAt: string;
  canManage: boolean;
};

export type AnnouncementPage = {
  items: Announcement[];
  total: number;
  page: number;
  totalPages: number;
  canPublish: boolean;
};

/** Each portal signs in with its own cookie and has its own page. */
export const ANNOUNCEMENT_PORTALS = {
  admin: {
    cookie: "acms_admin_session",
    loginPath: "/admin/login",
    basePath: "/admin/announcements",
  },
  pastor: {
    cookie: "acms_pastor_session",
    loginPath: "/login",
    basePath: "/pastor/announcements",
  },
  leader: {
    cookie: "acms_leader_session",
    loginPath: "/login",
    basePath: "/leader/announcements",
  },
  member: {
    cookie: "acms_member_session",
    loginPath: "/login",
    basePath: "/member/announcements",
  },
} as const;

export type AnnouncementPortal = keyof typeof ANNOUNCEMENT_PORTALS;

/** Portals whose users may post (the API still checks their roles). */
export const PUBLISHING_PORTALS = ["admin", "pastor", "leader"] as const;
export type PublishingPortal = (typeof PUBLISHING_PORTALS)[number];

export type AnnouncementView = {
  scope: "upcoming" | "past";
  kind?: AnnouncementKind;
  page: number;
};

/** Reads the board's view from untrusted query parameters. */
export function parseAnnouncementView(parameters: {
  scope?: string;
  kind?: string;
  page?: string;
}): AnnouncementView {
  const page = Number(parameters.page ?? 1);
  return {
    scope: parameters.scope === "past" ? "past" : "upcoming",
    kind:
      parameters.kind === "EVENT" || parameters.kind === "ANNOUNCEMENT"
        ? parameters.kind
        : undefined,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function announcementsApiPath(view: AnnouncementView) {
  const query = new URLSearchParams({
    scope: view.scope,
    page: String(view.page),
    limit: "12",
  });
  if (view.kind) query.set("kind", view.kind);
  return `/announcements?${query}`;
}

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: CHURCH_TIME_ZONE,
});
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: CHURCH_TIME_ZONE,
});

/** "Sat, 5 Dec 2026 · 6:00 pm – 9:00 pm" in the church timezone. */
export function formatAnnouncementWhen(item: {
  startsAt: string | null;
  endsAt: string | null;
}) {
  if (!item.startsAt) return null;
  const start = new Date(item.startsAt);
  const startText = `${dayFormat.format(start)} · ${timeFormat.format(start)}`;
  if (!item.endsAt) return startText;
  const end = new Date(item.endsAt);
  const sameDay = dayFormat.format(start) === dayFormat.format(end);
  return sameDay
    ? `${startText} – ${timeFormat.format(end)}`
    : `${startText} – ${dayFormat.format(end)} · ${timeFormat.format(end)}`;
}

/** Day and short month for the calendar badge on a card. */
export function announcementDateBadge(startsAt: string | null) {
  if (!startsAt) return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: CHURCH_TIME_ZONE,
    })
      .formatToParts(new Date(startsAt))
      .map((part) => [part.type, part.value]),
  );
  return { day: parts.day, month: parts.month };
}
