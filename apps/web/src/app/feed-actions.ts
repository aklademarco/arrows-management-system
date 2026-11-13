"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ANNOUNCEMENT_PORTALS } from "@/lib/announcements";

export type FeedActionState = {
  status: "idle" | "success" | "error";
  message: string;
  /** Changes on every result so forms can reset after success. */
  at: number;
};

const portalSchema = z.enum(["admin", "pastor", "leader", "member"]);
const moderatorPortalSchema = z.enum(["admin", "pastor"]);
const reactionSchema = z.enum(["LIKE", "AMEN", "LOVE"]);

const apiUrl = () => process.env.API_URL ?? "http://localhost:4000/api/v1";

const result = (
  status: FeedActionState["status"],
  message: string,
): FeedActionState => ({ status, message, at: Date.now() });

/** Calls the API with the portal's session. Re-renders the page on success. */
async function callApi(
  portal: z.infer<typeof portalSchema>,
  path: string,
  init: { method: string; body?: unknown },
  messages: { success: string; failure: string },
): Promise<FeedActionState> {
  const { cookie, loginPath } = ANNOUNCEMENT_PORTALS[portal];
  const token = (await cookies()).get(cookie)?.value;
  if (!token) redirect(loginPath);

  const response = await fetch(`${apiUrl()}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (response.status === 401) redirect(loginPath);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;
    return result(
      "error",
      response.status === 429
        ? "You're doing that too often. Please wait a moment."
        : (message ?? messages.failure),
    );
  }
  refresh();
  return result("success", messages.success);
}

function invalid(error: z.ZodError) {
  return result("error", error.issues[0]?.message ?? "Check the form and try again.");
}

const postFields = { portal: portalSchema, postId: z.uuid() };
const commentFields = { ...postFields, commentId: z.uuid() };
const read = (formData: FormData) => Object.fromEntries(formData);

/** Toggles a reaction: choosing your current reaction removes it. */
export async function reactToPost(
  _previous: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  const parsed = z
    .object({
      ...postFields,
      reaction: reactionSchema,
      current: z.union([reactionSchema, z.literal("")]),
    })
    .safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { portal, postId, reaction, current } = parsed.data;
  const removing = reaction === current;
  return callApi(
    portal,
    `/feed/${postId}/reaction`,
    removing ? { method: "DELETE" } : { method: "PUT", body: { reaction } },
    {
      success: removing ? "Reaction removed." : "Reaction saved.",
      failure: "Your reaction could not be saved.",
    },
  );
}

const commentBody = z
  .string()
  .trim()
  .min(1, "Write a comment first.")
  .max(1000, "Comments can be up to 1,000 characters.");

export async function addComment(
  _previous: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  const parsed = z
    .object({ ...postFields, body: commentBody })
    .safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { portal, postId, body } = parsed.data;
  return callApi(
    portal,
    `/feed/${postId}/comments`,
    { method: "POST", body: { body } },
    { success: "Comment posted.", failure: "Your comment could not be posted." },
  );
}

export async function editComment(
  _previous: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  const parsed = z
    .object({ ...commentFields, body: commentBody })
    .safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { portal, postId, commentId, body } = parsed.data;
  return callApi(
    portal,
    `/feed/${postId}/comments/${commentId}`,
    { method: "PATCH", body: { body } },
    { success: "Comment updated.", failure: "Your comment could not be updated." },
  );
}

export async function deleteComment(
  _previous: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  const parsed = z.object(commentFields).safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { portal, postId, commentId } = parsed.data;
  return callApi(
    portal,
    `/feed/${postId}/comments/${commentId}`,
    { method: "DELETE" },
    { success: "Comment removed.", failure: "Your comment could not be removed." },
  );
}

const reason = z
  .string()
  .trim()
  .min(3, "Give a short reason (at least 3 characters).")
  .max(300, "Keep the reason under 300 characters.");

export async function reportComment(
  _previous: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  const parsed = z
    .object({ ...commentFields, reason })
    .safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { portal, postId, commentId } = parsed.data;
  return callApi(
    portal,
    `/feed/${postId}/comments/${commentId}/report`,
    { method: "POST", body: { reason: parsed.data.reason } },
    {
      success: "Thank you. A pastor or administrator will review it.",
      failure: "The report could not be sent.",
    },
  );
}

export async function setPostPinned(
  _previous: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  const parsed = z
    .object({
      portal: moderatorPortalSchema,
      postId: z.uuid(),
      pinned: z.enum(["true", "false"]),
    })
    .safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { portal, postId } = parsed.data;
  const pinned = parsed.data.pinned === "true";
  return callApi(
    portal,
    `/feed/${postId}/pinned`,
    { method: "PUT", body: { pinned } },
    {
      success: pinned ? "Post pinned. Members have been notified." : "Post unpinned.",
      failure: "The post could not be updated.",
    },
  );
}

export async function setCommentsClosed(
  _previous: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  const parsed = z
    .object({
      portal: moderatorPortalSchema,
      postId: z.uuid(),
      closed: z.enum(["true", "false"]),
    })
    .safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { portal, postId } = parsed.data;
  const closed = parsed.data.closed === "true";
  return callApi(
    portal,
    `/feed/${postId}/comments-closed`,
    { method: "PUT", body: { closed } },
    {
      success: closed ? "Comments closed." : "Comments reopened.",
      failure: "The post could not be updated.",
    },
  );
}

export async function hideComment(
  _previous: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  const parsed = z
    .object({ portal: moderatorPortalSchema, commentId: z.uuid(), reason })
    .safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { portal, commentId } = parsed.data;
  return callApi(
    portal,
    `/feed/moderation/comments/${commentId}/hide`,
    { method: "POST", body: { reason: parsed.data.reason } },
    { success: "Comment hidden.", failure: "The comment could not be hidden." },
  );
}

export async function dismissCommentReports(
  _previous: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  const parsed = z
    .object({ portal: moderatorPortalSchema, commentId: z.uuid() })
    .safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { portal, commentId } = parsed.data;
  return callApi(
    portal,
    `/feed/moderation/comments/${commentId}/dismiss-reports`,
    { method: "POST" },
    {
      success: "Reports dismissed. The comment stays visible.",
      failure: "The reports could not be dismissed.",
    },
  );
}
