import { ANNOUNCEMENT_PORTALS, type AnnouncementPortal } from "./announcements";
import { CHURCH_TIME_ZONE } from "./church-time";

export const FEED_REACTIONS = [
  { value: "LIKE", label: "Like", emoji: "👍" },
  { value: "AMEN", label: "Amen", emoji: "🙏" },
  { value: "LOVE", label: "Love", emoji: "❤️" },
] as const;

export type FeedReaction = (typeof FEED_REACTIONS)[number]["value"];

export type FeedPost = {
  id: string;
  title: string;
  theme: string | null;
  description: string | null;
  locationName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  flyerUrl: string | null;
  authorName: string | null;
  authorPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  commentsClosed: boolean;
  reactionCounts: Record<FeedReaction, number>;
  myReaction: FeedReaction | null;
  commentCount: number;
  canManage: boolean;
  canModerate?: boolean;
};

export type FeedPage = {
  items: FeedPost[];
  total: number;
  page: number;
  totalPages: number;
  canPublish: boolean;
  canModerate: boolean;
};

export type FeedComment = {
  id: string;
  body: string;
  authorName: string | null;
  authorPhotoUrl: string | null;
  editedAt: string | null;
  createdAt: string;
  isOwn: boolean;
};

export type CommentPage = {
  items: FeedComment[];
  total: number;
  page: number;
  totalPages: number;
};

export type ReportedComment = {
  commentId: string;
  body: string;
  authorName: string | null;
  postId: string;
  postTitle: string;
  reportCount: number | string;
  reasons: string[];
  firstReportedAt: string;
};

/** The feed lives next to each portal's announcements board. */
export function feedBasePath(portal: AnnouncementPortal) {
  return ANNOUNCEMENT_PORTALS[portal].basePath.replace(
    /\/announcements$/,
    "/feed",
  );
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

export function positivePage(value: string | undefined) {
  const page = Number(value ?? 1);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

const postedFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: CHURCH_TIME_ZONE,
});

/** "5 Dec 2026, 6:00 pm" in the church timezone. */
export function formatPostedAt(value: string) {
  return postedFormat.format(new Date(value));
}

/** Starting state for feed forms that use `useActionState`. */
export const IDLE_FEED_STATE = {
  status: "idle" as "idle" | "success" | "error",
  message: "",
  at: 0,
};

/** Reddit-style age: "just now", "5m ago", "3h ago", "2d ago", then a date. */
export function formatAge(value: string, now: number = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return postedFormat.format(new Date(value)).replace(/,.*$/, "");
}
