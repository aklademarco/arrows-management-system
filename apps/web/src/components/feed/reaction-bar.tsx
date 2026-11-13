"use client";

import Link from "next/link";
import { useActionState, useOptimistic } from "react";
import { FiMessageCircle } from "react-icons/fi";

import { reactToPost } from "@/app/feed-actions";
import type { AnnouncementPortal } from "@/lib/announcements";
import { FEED_REACTIONS, IDLE_FEED_STATE, type FeedReaction } from "@/lib/feed";

import { ActionMessage } from "./action-message";
import { ShareButton } from "./share-button";

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

const compact = new Intl.NumberFormat("en", { notation: "compact" });

/**
 * X-style action row: comments, the three reactions, and share, each with
 * its count, spread across the post.
 */
export function ReactionBar({
  portal,
  postId,
  title,
  mine,
  counts,
  commentCount,
  commentHref,
}: {
  portal: AnnouncementPortal;
  postId: string;
  title: string;
  mine: FeedReaction | null;
  counts: Record<FeedReaction, number>;
  commentCount: number;
  commentHref: string;
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
      className="-ml-2 flex max-w-md items-center justify-between"
    >
      <input name="portal" type="hidden" value={portal} />
      <input name="postId" type="hidden" value={postId} />
      {/* The reaction the server knows about, so a repeat tap removes it. */}
      <input name="current" type="hidden" value={mine ?? ""} />

      <Link
        aria-label={`${commentCount} comments. Reply to ${title}`}
        className="group/action flex min-h-11 items-center gap-1 text-slate-500 transition hover:text-black focus-visible:outline-none"
        href={commentHref}
      >
        <span className="grid size-9 place-items-center rounded-full text-lg transition group-hover/action:bg-slate-100 group-focus-visible/action:ring-2 group-focus-visible/action:ring-black">
          <FiMessageCircle aria-hidden className="-scale-x-100" />
        </span>
        <span className="min-w-4 text-[13px] tabular-nums">
          {commentCount ? compact.format(commentCount) : ""}
        </span>
      </Link>

      {FEED_REACTIONS.map(({ value, label, emoji }) => {
        const active = optimistic.mine === value;
        const count = optimistic.counts[value];
        return (
          <button
            aria-label={`${label}, ${count}${active ? ", your reaction" : ""}`}
            aria-pressed={active}
            className={`group/action flex min-h-11 items-center gap-1 transition focus-visible:outline-none disabled:cursor-wait ${
              active ? "font-semibold text-black" : "text-slate-500 hover:text-black"
            }`}
            // Wait for the saved reaction so a quick second tap toggles correctly.
            disabled={pending}
            key={value}
            name="reaction"
            title={label}
            type="submit"
            value={value}
          >
            <span
              className={`grid size-9 place-items-center rounded-full text-[17px] transition group-hover/action:bg-slate-100 group-focus-visible/action:ring-2 group-focus-visible/action:ring-black group-active/action:scale-90 ${
                active ? "bg-slate-100" : "opacity-70 grayscale group-hover/action:opacity-100 group-hover/action:grayscale-0"
              }`}
            >
              <span aria-hidden>{emoji}</span>
            </span>
            <span className="min-w-4 text-[13px] tabular-nums">
              {count ? compact.format(count) : ""}
            </span>
          </button>
        );
      })}

      <ShareButton postId={postId} title={title} />
      <ActionMessage state={state} />
    </form>
  );
}
