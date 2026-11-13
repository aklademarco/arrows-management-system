import Image from "next/image";
import Link from "next/link";
import {
  FiArrowUpRight,
  FiEdit2,
  FiLock,
  FiMapPin,
  FiMessageSquare,
  FiMoreHorizontal,
} from "react-icons/fi";

import { ArchiveAnnouncementButton } from "@/components/announcements/archive-announcement-button";
import {
  formatAnnouncementWhen,
  PUBLISHING_PORTALS,
  type AnnouncementPortal,
  type PublishingPortal,
} from "@/lib/announcements";
import {
  feedBasePath,
  formatAge,
  formatPostedAt,
  type FeedPost,
} from "@/lib/feed";

import { Avatar } from "./avatar";
import { ModerationControls } from "./moderation-controls";
import { ReactionBar } from "./reaction-bar";

const pill =
  "inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

function isPublishingPortal(
  portal: AnnouncementPortal,
): portal is PublishingPortal {
  return (PUBLISHING_PORTALS as readonly string[]).includes(portal);
}

/** A Reddit-style post: meta line, bold title, body, media, action pills. */
export function PostCard({
  portal,
  post,
  canModerate,
  detail = false,
}: {
  portal: AnnouncementPortal;
  post: FeedPost;
  canModerate: boolean;
  /** The full post on its own page rather than a feed preview. */
  detail?: boolean;
}) {
  const feedPath = feedBasePath(portal);
  const postPath = `${feedPath}/${post.id}`;
  const moderatorPortal =
    canModerate && (portal === "admin" || portal === "pastor") ? portal : null;
  const managePortal =
    post.canManage && isPublishingPortal(portal) ? portal : null;
  const when = post.startsAt ? formatAnnouncementWhen(post) : null;
  const TitleTag = detail ? "h1" : "h2";

  return (
    <article
      className={`min-w-0 rounded-2xl border bg-white p-4 transition sm:p-5 ${
        post.isPinned
          ? "border-slate-300 shadow-sm shadow-slate-200/40"
          : detail
            ? "border-slate-200"
            : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {post.isPinned ? (
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black">
          <FiMapPin aria-hidden /> Pinned by church leadership
        </p>
      ) : null}
      <header className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
        <Avatar
          name={post.authorName}
          photoUrl={post.authorPhotoUrl}
          size="sm"
        />
        <span className="font-semibold text-slate-900">
          {post.authorName ?? "Church office"}
        </span>
        <span aria-hidden>•</span>
        <time
          dateTime={post.createdAt}
          suppressHydrationWarning
          title={formatPostedAt(post.createdAt)}
        >
          {formatAge(post.createdAt)}
        </time>
        {post.commentsClosed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
            <FiLock aria-hidden />
            Comments closed
          </span>
        ) : null}
      </header>

      <TitleTag
        className={`mt-3 break-words font-bold leading-snug tracking-tight text-slate-900 ${detail ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}
      >
        {detail ? (
          post.title
        ) : (
          <Link
            className="rounded-sm hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            href={postPath}
          >
            {post.title}
          </Link>
        )}
      </TitleTag>

      {post.theme || when || post.locationName ? (
        <p className="mt-1 text-xs font-medium text-slate-500">
          {[post.theme, when, post.locationName].filter(Boolean).join(" · ")}
        </p>
      ) : null}

      {post.description ? (
        <p
          className={`mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700 ${detail ? "" : "line-clamp-4"}`}
        >
          {post.description}
        </p>
      ) : null}

      {post.flyerUrl ? (
        <a
          aria-label={`Open the full image for ${post.title}`}
          className="relative mt-3 block aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-950"
          href={post.flyerUrl}
          rel="noreferrer"
          target="_blank"
        >
          <Image
            alt={`Image for ${post.title}`}
            className="object-contain"
            fill
            sizes="(min-width: 1024px) 720px, 100vw"
            src={post.flyerUrl}
            unoptimized
          />
        </a>
      ) : null}

      {!detail && post.description ? (
        <Link
          className="mt-2 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-black hover:underline"
          href={postPath}
        >
          Read post <FiArrowUpRight aria-hidden />
        </Link>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <ReactionBar
          counts={post.reactionCounts}
          mine={post.myReaction}
          portal={portal}
          postId={post.id}
        />
        {detail ? (
          <span className={pill}>
            <FiMessageSquare aria-hidden />
            {post.commentCount}{" "}
            {post.commentCount === 1 ? "comment" : "comments"}
          </span>
        ) : (
          <Link
            aria-label={`${post.commentCount} comments on ${post.title}`}
            className={pill}
            href={`${postPath}#comments`}
          >
            <FiMessageSquare aria-hidden />
            {post.commentCount}{" "}
            {post.commentCount === 1 ? "comment" : "comments"}
          </Link>
        )}
      </footer>
      {moderatorPortal || managePortal ? (
        <details className="group mt-2 border-t border-slate-100 pt-2">
          <summary className="flex min-h-9 w-fit cursor-pointer list-none items-center gap-2 rounded-full px-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-black [&::-webkit-details-marker]:hidden">
            <FiMoreHorizontal aria-hidden /> Manage post
          </summary>
          <div className="mt-1 flex flex-wrap gap-1 rounded-xl bg-slate-50 p-2">
            {moderatorPortal ? (
              <ModerationControls
                commentsClosed={post.commentsClosed}
                isPinned={post.isPinned}
                portal={moderatorPortal}
                postId={post.id}
                title={post.title}
              />
            ) : null}
            {managePortal ? (
              <>
                <Link
                  className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  href={`${feedPath}?edit=${post.id}`}
                >
                  <FiEdit2 aria-hidden />
                  Edit
                </Link>
                <ArchiveAnnouncementButton
                  destination="feed"
                  id={post.id}
                  portal={managePortal}
                  title={post.title}
                />
              </>
            ) : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}
