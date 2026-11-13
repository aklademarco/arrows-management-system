"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FiLoader, FiSend } from "react-icons/fi";

import { addComment } from "@/app/feed-actions";
import type { AnnouncementPortal } from "@/lib/announcements";
import { IDLE_FEED_STATE } from "@/lib/feed";

import { ActionMessage } from "./action-message";

export function CommentComposer({
  portal,
  postId,
}: {
  portal: AnnouncementPortal;
  postId: string;
}) {
  const [state, formAction, pending] = useActionState(
    addComment,
    IDLE_FEED_STATE,
  );
  const [length, setLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box once the comment is saved.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.at, state.status]);

  return (
    <form
      action={formAction}
      className="grid gap-2"
      onReset={() => setLength(0)}
      ref={formRef}
    >
      <input name="portal" type="hidden" value={portal} />
      <input name="postId" type="hidden" value={postId} />
      <label className="sr-only" htmlFor={`comment-${postId}`}>
        Write a comment
      </label>
      <textarea
        className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-500 focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-100"
        id={`comment-${postId}`}
        maxLength={1000}
        name="body"
        onChange={(event) => setLength(event.currentTarget.value.length)}
        placeholder="Join the conversation"
        required
      />
      <div className="flex items-center justify-between gap-3">
        <ActionMessage state={state} />
        <span className="ml-auto text-xs text-slate-400">{length}/1000</span>
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          disabled={pending || length === 0}
          type="submit"
        >
          {pending ? (
            <FiLoader aria-hidden className="animate-spin" />
          ) : (
            <FiSend aria-hidden />
          )}
          {pending ? "Posting…" : "Comment"}
        </button>
      </div>
    </form>
  );
}
