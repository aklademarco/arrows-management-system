import Link from "next/link";
import {
  FiArrowLeft,
  FiFeather,
  FiFlag,
  FiImage,
  FiMessageCircle,
} from "react-icons/fi";

import {
  ANNOUNCEMENT_PORTALS,
  PUBLISHING_PORTALS,
  type AnnouncementPortal,
  type PublishingPortal,
} from "@/lib/announcements";
import {
  feedBasePath,
  feedComposePath,
  feedListPath,
  type FeedPage,
} from "@/lib/feed";
import type { FeedFeedback } from "@/lib/feed-data";

import { FeedbackBanner } from "./feedback-banner";
import { PostCard } from "./post-card";

function isPublishingPortal(
  portal: AnnouncementPortal,
): portal is PublishingPortal {
  return (PUBLISHING_PORTALS as readonly string[]).includes(portal);
}

const iconLink =
  "grid size-10 place-items-center rounded-full text-xl text-slate-900 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-black";

/**
 * The feed as one full-width timeline, like X: edge to edge on phones and a
 * centred column with side borders on larger screens.
 */
export function FeedView({
  portal,
  feed,
  feedback,
}: {
  portal: AnnouncementPortal;
  feed: FeedPage;
  feedback: FeedFeedback | null;
}) {
  const publisher = isPublishingPortal(portal) ? portal : null;
  const composeHref =
    publisher && feed.canPublish ? feedComposePath(publisher) : null;
  const listPath = feedListPath(portal);
  const tab =
    "relative flex min-h-[52px] flex-1 items-center justify-center text-[15px] transition hover:bg-slate-100";

  return (
    // Cancel the page padding on phones so the timeline runs edge to edge.
    <div className="-mx-4 -mt-6 min-h-screen bg-white text-slate-900 sm:mx-auto sm:mt-0 sm:max-w-[600px] sm:border-x sm:border-slate-200">
      <header className="z-20 border-b border-slate-200 bg-white/85 backdrop-blur-md lg:sticky lg:top-0">
        <div className="flex h-[53px] items-center gap-2 px-2">
          {publisher ? (
            <Link aria-label="Feed menu" className={iconLink} href={feedBasePath(portal)}>
              <FiArrowLeft aria-hidden />
            </Link>
          ) : (
            <span className="w-2" />
          )}
          <h1 className="text-xl font-bold tracking-tight">Church feed</h1>
          {feed.canModerate && (portal === "admin" || portal === "pastor") ? (
            <Link
              aria-label="Reported comments"
              className={`${iconLink} ml-auto`}
              href={`${feedBasePath(portal)}/reports`}
            >
              <FiFlag aria-hidden />
            </Link>
          ) : null}
        </div>
        <nav aria-label="Feed sections" className="flex">
          <Link aria-current="page" className={`${tab} font-bold`} href={listPath}>
            Feed
            <span aria-hidden className="absolute bottom-0 h-1 w-14 rounded-full bg-black" />
          </Link>
          <Link
            className={`${tab} font-medium text-slate-500`}
            href={ANNOUNCEMENT_PORTALS[portal].basePath}
          >
            Events
          </Link>
        </nav>
      </header>

      {feedback ? (
        <div className="px-4 pt-3">
          <FeedbackBanner feedback={feedback} />
        </div>
      ) : null}

      {composeHref ? (
        // X's "What's happening?" prompt, opening the composer.
        <Link
          className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 transition hover:bg-slate-50"
          href={composeHref}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-lg text-slate-600">
            <FiFeather aria-hidden />
          </span>
          <span className="flex-1 text-xl text-slate-500">What&apos;s happening?</span>
          <FiImage aria-hidden className="text-xl text-slate-900" />
        </Link>
      ) : null}

      {feed.page > 1 ? (
        <Link
          className="block border-b border-slate-200 py-3 text-center text-[15px] font-medium text-slate-900 hover:bg-slate-50"
          href={feed.page === 2 ? listPath : `${listPath}?page=${feed.page - 1}`}
        >
          Show newer posts
        </Link>
      ) : null}

      {feed.items.length === 0 ? (
        <section className="px-8 py-16">
          <span className="grid size-14 place-items-center rounded-full bg-slate-100 text-2xl">
            <FiMessageCircle aria-hidden className="-scale-x-100" />
          </span>
          <h2 className="mt-4 text-[31px] font-extrabold leading-9 tracking-tight">
            Nothing here yet
          </h2>
          <p className="mt-2 text-[15px] text-slate-500">
            {composeHref
              ? "When you share a post, it shows up here for the whole church."
              : "News and notices from the church will show up here."}
          </p>
        </section>
      ) : (
        <section aria-label="Posts">
          {feed.items.map((post) => (
            <PostCard
              canModerate={feed.canModerate}
              key={post.id}
              portal={portal}
              post={post}
            />
          ))}
        </section>
      )}

      {feed.page < feed.totalPages ? (
        <Link
          className="block border-b border-slate-200 py-4 text-center text-[15px] font-medium text-slate-900 hover:bg-slate-50"
          href={`${listPath}?page=${feed.page + 1}`}
        >
          Show older posts
        </Link>
      ) : feed.items.length > 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          You&apos;re all caught up.
        </p>
      ) : null}

      {composeHref ? (
        // Floating compose button, kept above the phone's bottom tab bar.
        <Link
          aria-label="Create post"
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-30 grid size-14 place-items-center rounded-full bg-black text-2xl text-white shadow-lg shadow-black/25 transition hover:bg-slate-800 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black lg:bottom-8 lg:right-8"
          href={composeHref}
        >
          <FiFeather aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
