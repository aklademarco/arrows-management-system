"use client";

import { useActionState, useCallback, useState } from "react";

import {
  deleteComment,
  editComment,
  hideComment,
  reportComment,
  type FeedActionState,
} from "@/app/feed-actions";
import type { AnnouncementPortal } from "@/lib/announcements";
import {
  formatAge,
  formatPostedAt,
  IDLE_FEED_STATE,
  type FeedComment,
} from "@/lib/feed";

import { ActionMessage } from "./action-message";
import { Avatar } from "./avatar";
import { ReasonForm } from "./reason-form";

type Mode = "view" | "edit" | "report" | "hide";

const linkButton =
  "inline-flex h-7 items-center rounded-full px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";

export function CommentItem({
  portal,
  postId,
  comment,
  commentsClosed,
  canModerate,
}: {
  portal: AnnouncementPortal;
  postId: string;
  comment: FeedComment;
  commentsClosed: boolean;
  canModerate: boolean;
}) {
  const [mode, setMode] = useState<Mode>("view");
  const [reported, setReported] = useState(false);
  const [editState, editAction, editing] = useActionState(
    async (previous: FeedActionState, formData: FormData) => {
      const result = await editComment(previous, formData);
      if (result.status === "success") setMode("view");
      return result;
    },
    IDLE_FEED_STATE,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteComment,
    IDLE_FEED_STATE,
  );
  const close = useCallback(() => setMode("view"), []);
  const markReported = useCallback(() => {
    setReported(true);
    setMode("view");
  }, []);

  const ids = { portal, postId, commentId: comment.id };
  const author = comment.authorName ?? "Church member";

  return (
    <li className="flex gap-2.5 pt-4">
      {/* Avatar with a thread rail beneath it, as in Reddit threads. */}
      <div className="flex flex-col items-center">
        <Avatar name={comment.authorName} photoUrl={comment.authorPhotoUrl} size="sm" />
        <span aria-hidden className="mt-1 w-px flex-1 bg-slate-200" />
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs">
          <span className="font-semibold text-slate-900">{author}</span>
          <span aria-hidden className="text-slate-400">•</span>
          <time
            className="text-slate-500"
            dateTime={comment.createdAt}
            suppressHydrationWarning
            title={formatPostedAt(comment.createdAt)}
          >
            {formatAge(comment.createdAt)}
          </time>
          {comment.editedAt ? (
            <span className="text-slate-400">• edited</span>
          ) : null}
        </p>

        {mode === "edit" ? (
          <form action={editAction} className="mt-2 grid gap-2">
            {Object.entries(ids).map(([name, value]) => (
              <input key={name} name={name} type="hidden" value={value} />
            ))}
            <label className="sr-only" htmlFor={`edit-${comment.id}`}>
              Edit your comment
            </label>
            <textarea
              autoFocus
              className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              defaultValue={comment.body}
              id={`edit-${comment.id}`}
              maxLength={1000}
              name="body"
              required
            />
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                disabled={editing}
                type="submit"
              >
                {editing ? "Saving…" : "Save"}
              </button>
              <button
                className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-slate-100"
                onClick={close}
                type="button"
              >
                Cancel
              </button>
              <ActionMessage state={editState} />
            </div>
          </form>
        ) : (
          <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
            {comment.body}
          </p>
        )}

        {mode === "view" ? (
          <div className="-ml-2 mt-0.5 flex flex-wrap items-center gap-0.5">
            {comment.isOwn ? (
              <>
                {commentsClosed ? null : (
                  <button className={linkButton} onClick={() => setMode("edit")} type="button">
                    Edit
                  </button>
                )}
                <form
                  action={deleteAction}
                  onSubmit={(event) => {
                    if (!window.confirm("Remove your comment?")) event.preventDefault();
                  }}
                >
                  {Object.entries(ids).map(([name, value]) => (
                    <input key={name} name={name} type="hidden" value={value} />
                  ))}
                  <button className={linkButton} disabled={deleting} type="submit">
                    {deleting ? "Removing…" : "Remove"}
                  </button>
                </form>
              </>
            ) : reported ? (
              <span className="text-xs text-emerald-700" role="status">
                Reported. Thank you.
              </span>
            ) : (
              <button className={linkButton} onClick={() => setMode("report")} type="button">
                Report
              </button>
            )}
            {canModerate && !comment.isOwn ? (
              <button
                className={`${linkButton} hover:text-red-700`}
                onClick={() => setMode("hide")}
                type="button"
              >
                Hide
              </button>
            ) : null}
            <ActionMessage state={deleteState} />
          </div>
        ) : null}

        {mode === "report" ? (
          <ReasonForm
            action={reportComment}
            fields={ids}
            label={`Why are you reporting ${author}'s comment?`}
            onCancel={close}
            onDone={markReported}
            pendingLabel="Sending…"
            placeholder="For example: unkind or inappropriate"
            submitLabel="Send report"
          />
        ) : null}
        {mode === "hide" ? (
          <ReasonForm
            action={hideComment}
            fields={{ portal, commentId: comment.id }}
            label="Reason for hiding (kept in the audit log)"
            onCancel={close}
            pendingLabel="Hiding…"
            placeholder="For example: abusive language"
            submitLabel="Hide comment"
            tone="danger"
          />
        ) : null}
      </div>
    </li>
  );
}
