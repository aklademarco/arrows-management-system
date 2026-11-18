import { unstable_rethrow } from "next/navigation";

import {
  announcementsApiPath,
  parseAnnouncementView,
  type Announcement,
  type AnnouncementPage,
} from "./announcements";

export type AnnouncementBoardSearchParams = {
  scope?: string;
  kind?: string;
  page?: string;
  compose?: string;
  edit?: string;
  feedback?: string;
  message?: string;
};

export type BoardFeedback = {
  kind: "success" | "error";
  message: string;
};

type FetchResource = <T>(path: string) => Promise<T>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loads everything the announcements board needs, using a portal's fetcher. */
export async function loadAnnouncementBoard(
  fetchResource: FetchResource,
  parameters: AnnouncementBoardSearchParams,
) {
  // This board lists church events; announcements live in the feed.
  const view = { ...parseAnnouncementView(parameters), kind: "EVENT" as const };
  const editId =
    parameters.edit && UUID_PATTERN.test(parameters.edit)
      ? parameters.edit
      : undefined;

  const [page, editing] = await Promise.all([
    fetchResource<AnnouncementPage>(announcementsApiPath(view)),
    editId ? loadEditable(fetchResource, editId) : Promise.resolve(null),
  ]);

  const feedbackKind = parameters.feedback;
  const feedback: BoardFeedback | null =
    (feedbackKind === "success" || feedbackKind === "error") &&
    parameters.message
      ? { kind: feedbackKind, message: parameters.message.slice(0, 300) }
      : null;

  return {
    page,
    view,
    editing,
    composing: parameters.compose === "1",
    feedback,
  };
}

/** A post the viewer may edit, or null if it is gone or not theirs. */
async function loadEditable(fetchResource: FetchResource, id: string) {
  try {
    const item = await fetchResource<Announcement>(`/announcements/${id}`);
    return item.canManage ? item : null;
  } catch (error) {
    // Keep login redirects working; otherwise just hide the edit form.
    unstable_rethrow(error);
    return null;
  }
}
