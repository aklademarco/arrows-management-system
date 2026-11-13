"use client";

import { useActionState } from "react";
import { FiLock, FiMapPin, FiUnlock } from "react-icons/fi";

import { setCommentsClosed, setPostPinned } from "@/app/feed-actions";
import { IDLE_FEED_STATE } from "@/lib/feed";

import { ActionMessage } from "./action-message";

const buttonClass =
  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60";

/** Pin and close-comments switches for administrators and pastors. */
export function ModerationControls({
  portal,
  postId,
  title,
  isPinned,
  commentsClosed,
}: {
  portal: "admin" | "pastor";
  postId: string;
  title: string;
  isPinned: boolean;
  commentsClosed: boolean;
}) {
  const [pinState, pinAction, pinning] = useActionState(setPostPinned, IDLE_FEED_STATE);
  const [closeState, closeAction, closing] = useActionState(
    setCommentsClosed,
    IDLE_FEED_STATE,
  );

  return (
    <div className="contents">
      <form
        action={pinAction}
        onSubmit={(event) => {
          if (
            !isPinned &&
            !window.confirm(
              `Pin "${title}"? Every active member will get a notification.`,
            )
          )
            event.preventDefault();
        }}
      >
        <input name="portal" type="hidden" value={portal} />
        <input name="postId" type="hidden" value={postId} />
        <input name="pinned" type="hidden" value={String(!isPinned)} />
        <button className={buttonClass} disabled={pinning} type="submit">
          <FiMapPin aria-hidden />
          {isPinned ? "Unpin" : "Pin & notify"}
        </button>
      </form>
      <form action={closeAction}>
        <input name="portal" type="hidden" value={portal} />
        <input name="postId" type="hidden" value={postId} />
        <input name="closed" type="hidden" value={String(!commentsClosed)} />
        <button className={buttonClass} disabled={closing} type="submit">
          {commentsClosed ? <FiUnlock aria-hidden /> : <FiLock aria-hidden />}
          {commentsClosed ? "Reopen comments" : "Close comments"}
        </button>
      </form>
      <ActionMessage state={pinState} />
      <ActionMessage state={closeState} />
    </div>
  );
}
