import { notFound } from "next/navigation";

import type { Announcement, AnnouncementPortal } from "./announcements";
import { isUuid } from "./feed";
import { feedFetch, type FeedFeedback } from "./feed-data";

export type EventSearchParams = { feedback?: string; message?: string };

/** Loads one church event for its page. Anything else renders "not found". */
export async function loadEvent(
  portal: AnnouncementPortal,
  id: string,
  parameters: EventSearchParams,
) {
  if (!isUuid(id)) notFound();
  const event = await feedFetch<Announcement>(portal, `/announcements/${id}`);
  // Feed posts have their own page in the feed.
  if (event.kind !== "EVENT") notFound();

  const kind = parameters.feedback;
  const feedback: FeedFeedback | null =
    (kind === "success" || kind === "error") && parameters.message
      ? { kind, message: parameters.message.slice(0, 300) }
      : null;
  return { event, feedback };
}
