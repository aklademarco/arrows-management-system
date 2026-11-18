"use client";

import { useActionState, useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";

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
import { HIDE_REASONS, REPORT_REASONS, ReasonPicker } from "./reason-picker";
import { Sheet, SheetHeader, sheetOption } from "./sheet";

type SheetView = "closed" | "menu" | "delete" | "report" | "hide";

/** One comment: "name text", with a "…" sheet for its options. */
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
  const [sheet, setSheet] = useState<SheetView>("closed");
  const [editing, setEditing] = useState(false);
  const closeSheet = () => setSheet("closed");
  const [editState, editAction, saving] = useActionState(
    async (previous: FeedActionState, formData: FormData) => {
      const result = await editComment(previous, formData);
      if (result.status === "success") setEditing(false);
      return result;
    },
    IDLE_FEED_STATE,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    async (previous: FeedActionState, formData: FormData) => {
      const result = await deleteComment(previous, formData);
      if (result.status === "success") setSheet("closed");
      return result;
    },
    IDLE_FEED_STATE,
  );

  const ids = { portal, postId, commentId: comment.id };
  const hiddenIds = Object.entries(ids).map(([name, value]) => (
    <input key={name} name={name} type="hidden" value={value} />
  ));
  const author = comment.authorName ?? "Church member";
  const canEdit = comment.isOwn && !commentsClosed;

  return (
    <li className="group flex gap-3 border-b border-slate-200 px-4 py-3 transition hover:bg-slate-50/70">
      <Avatar name={comment.authorName} photoUrl={comment.authorPhotoUrl} />
      <div className="min-w-0 flex-1">
        {editing ? (
          <form action={editAction}>
            {hiddenIds}
            <label className="sr-only" htmlFor={`edit-${comment.id}`}>
              Edit your comment
            </label>
            <textarea
              autoFocus
              className="field-sizing-content w-full resize-none rounded-xl bg-slate-100 px-3 py-2 text-sm leading-5 outline-none focus:ring-2 focus:ring-black"
              defaultValue={comment.body}
              id={`edit-${comment.id}`}
              maxLength={1000}
              name="body"
              required
            />
            <div className="mt-1 flex items-center gap-4 text-xs font-semibold">
              <button
                className="text-slate-500 hover:text-slate-900"
                onClick={() => setEditing(false)}
                type="button"
              >
                Cancel
              </button>
              <button className="text-black hover:text-slate-500 disabled:opacity-50" disabled={saving} type="submit">
                {saving ? "Saving…" : "Done"}
              </button>
              <ActionMessage state={editState} />
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start gap-1">
              <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1 text-[15px] leading-5">
                <span className="truncate font-bold">{author}</span>
                <span aria-hidden className="text-slate-500">
                  ·
                </span>
                <time
                  className="text-slate-500"
                  dateTime={comment.createdAt}
                  suppressHydrationWarning
                  title={formatPostedAt(comment.createdAt)}
                >
                  {formatAge(comment.createdAt).replace(" ago", "")}
                </time>
                {comment.editedAt ? (
                  <span className="text-[13px] text-slate-500">· Edited</span>
                ) : null}
              </p>
              <button
                aria-haspopup="dialog"
                aria-label={`Options for ${author}'s comment`}
                className="-mr-2 -mt-1.5 grid size-9 shrink-0 place-items-center rounded-full text-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-black [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                onClick={() => setSheet("menu")}
                type="button"
              >
                <FiMoreHorizontal aria-hidden />
              </button>
            </div>
            <p className="mt-0.5 whitespace-pre-line break-words text-[15px] leading-5 text-slate-900">
              {comment.body}
            </p>
          </>
        )}
      </div>

      <Sheet label="Comment options" onClose={closeSheet} open={sheet !== "closed"}>
        {sheet === "delete" ? (
          <form action={deleteAction}>
            <SheetHeader detail="It will be removed from this post." title="Delete comment?" />
            {deleteState.status === "error" ? (
              <p className="bg-red-50 px-4 py-2.5 text-center text-sm text-red-700" role="alert">
                {deleteState.message}
              </p>
            ) : null}
            {hiddenIds}
            <button className={sheetOption("danger")} disabled={deleting} type="submit">
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button className={sheetOption()} onClick={closeSheet} type="button">
              Cancel
            </button>
          </form>
        ) : sheet === "report" ? (
          <ReasonPicker
            action={reportComment}
            detail="Your report is private. A pastor or administrator will review it."
            doneDetail="A pastor or administrator will review this comment."
            doneTitle="Thanks for letting us know"
            fields={ids}
            onClose={closeSheet}
            reasons={REPORT_REASONS}
            title="Why are you reporting this comment?"
          />
        ) : sheet === "hide" ? (
          <ReasonPicker
            action={hideComment}
            detail="The comment disappears for everyone. Your reason is kept in the audit log."
            fields={{ portal, commentId: comment.id }}
            onClose={closeSheet}
            reasons={HIDE_REASONS}
            title="Why hide this comment?"
          />
        ) : (
          <div>
            {comment.isOwn ? (
              <button className={sheetOption("danger")} onClick={() => setSheet("delete")} type="button">
                Delete
              </button>
            ) : (
              <button className={sheetOption("danger")} onClick={() => setSheet("report")} type="button">
                Report
              </button>
            )}
            {canModerate && !comment.isOwn ? (
              <button className={sheetOption("danger")} onClick={() => setSheet("hide")} type="button">
                Hide comment
              </button>
            ) : null}
            {canEdit ? (
              <button
                className={sheetOption()}
                onClick={() => {
                  setEditing(true);
                  closeSheet();
                }}
                type="button"
              >
                Edit
              </button>
            ) : null}
            <button className={sheetOption()} onClick={closeSheet} type="button">
              Cancel
            </button>
          </div>
        )}
      </Sheet>
    </li>
  );
}
