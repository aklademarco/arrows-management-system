"use client";

import { useActionState, useOptimistic } from "react";

import { reactToPost } from "@/app/feed-actions";
import type { AnnouncementPortal } from "@/lib/announcements";
import { FEED_REACTIONS, IDLE_FEED_STATE, type FeedReaction } from "@/lib/feed";

import { ActionMessage } from "./action-message";

type ReactionState = {
  mine: FeedReaction | null;
  counts: Record<FeedReaction, number>;
};

/** Applies a tap locally: same reaction removes it, another switches. */
function toggle(state: ReactionState, chosen: FeedReaction): ReactionState {
  const counts = { ...state.counts };
  if (state.mine) counts[state.mine] = Math.max(0, counts[state.mine] - 1);
  if (state.mine === chosen) return { mine: null, counts };
  counts[chosen] += 1;
  return { mine: chosen, counts };
}

export function ReactionBar({
  portal,
  postId,
  mine,
  counts,
}: {
  portal: AnnouncementPortal;
  postId: string;
  mine: FeedReaction | null;
  counts: Record<FeedReaction, number>;
}) {
  const [optimistic, applyTap] = useOptimistic({ mine, counts }, toggle);
  const [state, formAction, pending] = useActionState(
    reactToPost,
    IDLE_FEED_STATE,
  );

  return (
    <form
      action={(formData) => {
        applyTap(String(formData.get("reaction")) as FeedReaction);
        formAction(formData);
      }}
      className="contents"
    >
      <input name="portal" type="hidden" value={portal} />
      <input name="postId" type="hidden" value={postId} />
      {/* The reaction the server knows about, so a repeat tap removes it. */}
      <input name="current" type="hidden" value={mine ?? ""} />
      {FEED_REACTIONS.map(({ value, label, emoji }) => {
        const active = optimistic.mine === value;
        const count = optimistic.counts[value];
        return (
          <button
            aria-label={`${label}${count ? `, ${count}` : ""}${active ? ", your reaction" : ""}`}
            aria-pressed={active}
            disabled={pending}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
              active
                ? "bg-black text-white hover:bg-slate-800"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            key={value}
            name="reaction"
            type="submit"
            value={value}
          >
            <span aria-hidden>{emoji}</span>
            {label}
            <span className="tabular-nums">{count}</span>
          </button>
        );
      })}
      <ActionMessage state={state} />
    </form>
  );
}
