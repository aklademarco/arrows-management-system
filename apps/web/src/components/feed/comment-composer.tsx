"use client";

import { useActionState, useRef, useState } from "react";

import { addComment, type FeedActionState } from "@/app/feed-actions";
import type { AnnouncementPortal } from "@/lib/announcements";
import { IDLE_FEED_STATE } from "@/lib/feed";

import { ActionMessage } from "./action-message";

/** X's reply box: "Post your reply" with a round Reply button. */
export function CommentComposer({
  portal,
  postId,
}: {
  portal: AnnouncementPortal;
  postId: string;
}) {
  const [text, setText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (previous: FeedActionState, formData: FormData) => {
      const result = await addComment(previous, formData);
      if (result.status === "success") setText("");
      return result;
    },
    IDLE_FEED_STATE,
  );

  return (
    <form action={formAction} id="add-comment" ref={formRef}>
      <input name="portal" type="hidden" value={portal} />
      <input name="postId" type="hidden" value={postId} />
      <div className="flex items-center gap-3" id="reply">
        <label className="sr-only" htmlFor={`comment-${postId}`}>
          Post your reply
        </label>
        <textarea
          className="field-sizing-content max-h-40 min-h-7 flex-1 resize-none bg-transparent py-1 text-[17px] leading-6 outline-none placeholder:text-slate-500"
          id={`comment-${postId}`}
          maxLength={1000}
          name="body"
          onChange={(event) => setText(event.currentTarget.value)}
          onKeyDown={(event) => {
            // Enter posts; Shift+Enter adds a new line.
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (text.trim()) formRef.current?.requestSubmit();
            }
          }}
          placeholder="Post your reply"
          rows={1}
          value={text}
        />
        <button
          className="h-9 shrink-0 rounded-full bg-black px-4 text-[15px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-40"
          disabled={pending || !text.trim()}
          type="submit"
        >
          {pending ? "Replying…" : "Reply"}
        </button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}
