"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FiMoreHorizontal } from "react-icons/fi";

import { archiveAnnouncement } from "@/app/announcement-actions";
import {
  setCommentsClosed,
  setPostPinned,
  type FeedActionState,
} from "@/app/feed-actions";
import type { PublishingPortal } from "@/lib/announcements";
import { IDLE_FEED_STATE } from "@/lib/feed";

import { Sheet, SheetHeader, sheetOption } from "./sheet";

type View = "menu" | "pin" | "archive";

/** The "…" button on a post, opening its options sheet. */
export function PostMenu({
  post,
  postHref,
  editHref,
  managePortal,
  moderatorPortal,
}: {
  post: { id: string; title: string; isPinned: boolean; commentsClosed: boolean };
  /** Shown as "Go to post" when the menu is opened from the feed. */
  postHref?: string;
  editHref?: string;
  /** Set when the viewer may edit and archive this post. */
  managePortal: PublishingPortal | null;
  /** Set when the viewer may pin and close comments. */
  moderatorPortal: "admin" | "pastor" | null;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const close = () => {
    setOpen(false);
    setView("menu");
  };
  const closeOnSuccess =
    (action: typeof setPostPinned) =>
    async (previous: FeedActionState, formData: FormData) => {
      const result = await action(previous, formData);
      if (result.status === "success") close();
      return result;
    };
  const [pinState, pinAction, pinning] = useActionState(
    closeOnSuccess(setPostPinned),
    IDLE_FEED_STATE,
  );
  const [lockState, lockAction, locking] = useActionState(
    closeOnSuccess(setCommentsClosed),
    IDLE_FEED_STATE,
  );
  const error = [pinState, lockState].find((state) => state.status === "error");

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={`More options for ${post.title}`}
        className="grid size-9 place-items-center rounded-full text-xl text-slate-900 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-black"
        onClick={() => setOpen(true)}
        type="button"
      >
        <FiMoreHorizontal aria-hidden />
      </button>
      <Sheet label="Post options" onClose={close} open={open}>
        {view === "pin" && moderatorPortal ? (
          <form action={pinAction}>
            <SheetHeader
              detail="Pinned posts stay at the top of the feed, and every active member gets a notification."
              title="Pin and notify everyone?"
            />
            <input name="portal" type="hidden" value={moderatorPortal} />
            <input name="postId" type="hidden" value={post.id} />
            <input name="pinned" type="hidden" value="true" />
            <button className={sheetOption("strong")} disabled={pinning} type="submit">
              {pinning ? "Pinning…" : "Pin and notify"}
            </button>
            <button className={sheetOption()} onClick={() => setView("menu")} type="button">
              Cancel
            </button>
          </form>
        ) : view === "archive" && managePortal ? (
          <form action={archiveAnnouncement}>
            <SheetHeader
              detail="Members will no longer see it. The post is kept in the records."
              title="Archive this post?"
            />
            <input name="portal" type="hidden" value={managePortal} />
            <input name="id" type="hidden" value={post.id} />
            <input name="destination" type="hidden" value="feed" />
            <button className={sheetOption("danger")} type="submit">
              Archive
            </button>
            <button className={sheetOption()} onClick={() => setView("menu")} type="button">
              Cancel
            </button>
          </form>
        ) : (
          <div>
            {error ? (
              <p className="bg-red-50 px-4 py-2.5 text-center text-sm text-red-700" role="alert">
                {error.message}
              </p>
            ) : null}
            {managePortal ? (
              <button className={sheetOption("danger")} onClick={() => setView("archive")} type="button">
                Archive
              </button>
            ) : null}
            {moderatorPortal ? (
              post.isPinned ? (
                <form action={pinAction}>
                  <input name="portal" type="hidden" value={moderatorPortal} />
                  <input name="postId" type="hidden" value={post.id} />
                  <input name="pinned" type="hidden" value="false" />
                  <button className={sheetOption()} disabled={pinning} type="submit">
                    {pinning ? "Unpinning…" : "Unpin"}
                  </button>
                </form>
              ) : (
                <button className={sheetOption()} onClick={() => setView("pin")} type="button">
                  Pin to top
                </button>
              )
            ) : null}
            {moderatorPortal ? (
              <form action={lockAction}>
                <input name="portal" type="hidden" value={moderatorPortal} />
                <input name="postId" type="hidden" value={post.id} />
                <input name="closed" type="hidden" value={String(!post.commentsClosed)} />
                <button className={sheetOption()} disabled={locking} type="submit">
                  {post.commentsClosed ? "Turn on commenting" : "Turn off commenting"}
                </button>
              </form>
            ) : null}
            {managePortal && editHref ? (
              <Link className={sheetOption()} href={editHref}>
                Edit
              </Link>
            ) : null}
            {postHref ? (
              <Link className={sheetOption()} href={postHref}>
                Go to post
              </Link>
            ) : null}
            <button className={sheetOption()} onClick={close} type="button">
              Cancel
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}
