import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  ANNOUNCEMENT_PORTALS,
  type Announcement,
  type AnnouncementPortal,
} from "./announcements";
import {
  isUuid,
  positivePage,
  type CommentPage,
  type FeedPage,
  type FeedPost,
  type ReportedComment,
} from "./feed";

export type FeedSearchParams = {
  page?: string;
  compose?: string;
  edit?: string;
  feedback?: string;
  message?: string;
};

export type FeedFeedback = { kind: "success" | "error"; message: string };

/**
 * Reads the feed API with a portal's session. Missing, hidden, archived, or
 * forbidden content all render as "not found" so nothing leaks by URL.
 */
async function feedFetch<T>(portal: AnnouncementPortal, path: string): Promise<T> {
  const { cookie, loginPath } = ANNOUNCEMENT_PORTALS[portal];
  const token = (await cookies()).get(cookie)?.value;
  if (!token) redirect(loginPath);
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401) redirect(loginPath);
  if (response.status === 403 || response.status === 404) notFound();
  if (!response.ok) {
    throw new Error(`Feed request ${path} failed (${response.status}).`);
  }
  const body = (await response.json()) as { data: T };
  return body.data;
}

function readFeedback(parameters: FeedSearchParams): FeedFeedback | null {
  const kind = parameters.feedback;
  return (kind === "success" || kind === "error") && parameters.message
    ? { kind, message: parameters.message.slice(0, 300) }
    : null;
}

export async function loadFeed(
  portal: AnnouncementPortal,
  parameters: FeedSearchParams,
) {
  const page = positivePage(parameters.page);
  const editId = isUuid(parameters.edit) ? parameters.edit : undefined;
  const [feed, editing] = await Promise.all([
    feedFetch<FeedPage>(portal, `/feed?page=${page}&limit=10`),
    editId
      ? feedFetch<Announcement>(portal, `/announcements/${editId}`)
      : Promise.resolve(null),
  ]);
  return {
    feed,
    editing: editing?.canManage ? editing : null,
    composing: parameters.compose === "1",
    feedback: readFeedback(parameters),
  };
}

export async function loadFeedPost(
  portal: AnnouncementPortal,
  postId: string,
  parameters: { page?: string },
) {
  if (!isUuid(postId)) notFound();
  const page = positivePage(parameters.page);
  const [post, comments] = await Promise.all([
    feedFetch<FeedPost>(portal, `/feed/${postId}`),
    feedFetch<CommentPage>(portal, `/feed/${postId}/comments?page=${page}&limit=50`),
  ]);
  return { post, comments };
}

export function loadReportedComments(portal: "admin" | "pastor") {
  return feedFetch<ReportedComment[]>(portal, "/feed/moderation/reports");
}
