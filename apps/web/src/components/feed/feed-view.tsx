import Link from "next/link";
import {
  FiArrowDown,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiMessageSquare,
  FiPlus,
} from "react-icons/fi";

import { AnnouncementForm } from "@/components/announcements/announcement-form";
import {
  PUBLISHING_PORTALS,
  ANNOUNCEMENT_PORTALS,
  type Announcement,
  type AnnouncementPortal,
  type PublishingPortal,
} from "@/lib/announcements";
import { feedBasePath, type FeedPage } from "@/lib/feed";
import type { FeedFeedback } from "@/lib/feed-data";

import { FeedbackBanner } from "./feedback-banner";
import { FeedSidebar } from "./feed-sidebar";
import { PostCard } from "./post-card";

function isPublishingPortal(
  portal: AnnouncementPortal,
): portal is PublishingPortal {
  return (PUBLISHING_PORTALS as readonly string[]).includes(portal);
}

const pageLink =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50";

export function FeedView({
  portal,
  feed,
  composing,
  editing,
  feedback,
}: {
  portal: AnnouncementPortal;
  feed: FeedPage;
  composing: boolean;
  editing: Announcement | null;
  feedback: FeedFeedback | null;
}) {
  const feedPath = feedBasePath(portal);
  const publisher = isPublishingPortal(portal) ? portal : null;
  const canPublish = Boolean(publisher) && feed.canPublish;
  const showForm = publisher && (editing || (composing && canPublish));

  return (
    <div className="mx-auto max-w-6xl text-slate-900">
      <header className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div
          aria-hidden
          className="relative h-20 overflow-hidden bg-black sm:h-28"
        >
          <div className="absolute -right-8 -top-24 size-64 rounded-full border-[32px] border-white/10" />
          <div className="absolute left-1/3 top-8 h-40 w-80 -rotate-12 rounded-full bg-white/10" />
          <div className="absolute bottom-4 left-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/70 sm:left-6">
            The Arrows community
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span
              aria-hidden
              className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-2xl text-black sm:size-14"
            >
              <FiMessageSquare />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Church feed
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                One church. More conversations.
              </p>
            </div>
          </div>
          {canPublish && !showForm ? (
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              href={`${feedPath}?compose=1`}
            >
              <FiPlus aria-hidden /> Create post
            </Link>
          ) : null}
        </div>
        <nav
          aria-label="Community sections"
          className="flex gap-6 border-t border-slate-100 px-5 text-sm font-semibold sm:px-6"
        >
          <Link
            aria-current="page"
            className="flex min-h-12 items-center gap-2 border-b-2 border-black text-black"
            href={feedPath}
          >
            <FiMessageSquare aria-hidden /> Feed
          </Link>
          <Link
            className="flex min-h-12 items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-black"
            href={ANNOUNCEMENT_PORTALS[portal].basePath}
          >
            <FiCalendar aria-hidden /> Events
          </Link>
        </nav>
      </header>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="grid min-w-0 content-start gap-4">
          <FeedbackBanner feedback={feedback} />

          {showForm ? (
            <AnnouncementForm
              basePath={feedPath}
              destination="feed"
              initial={editing ?? undefined}
              key={editing?.id ?? "new"}
              lockedKind={editing?.kind ?? "ANNOUNCEMENT"}
              portal={publisher}
            />
          ) : canPublish ? (
            <Link
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-slate-400"
              href={`${feedPath}?compose=1`}
            >
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-black"
              >
                <FiPlus className="text-xl" />
              </span>
              <span className="flex min-h-11 flex-1 items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 group-hover:border-slate-300">
                Share something with the church…
              </span>
              <FiImage aria-hidden className="text-xl text-slate-500" />
            </Link>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500">
            <h2 className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
              <FiArrowDown aria-hidden /> Latest posts{" "}
              <span className="ml-1 rounded-full bg-slate-200/70 px-2 py-0.5 tabular-nums">
                {feed.total}
              </span>
            </h2>
            <p>Pinned notices appear first</p>
          </div>

          {feed.items.length === 0 ? (
            <section className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div>
                <FiMessageSquare
                  aria-hidden
                  className="mx-auto text-4xl text-slate-300"
                />
                <h2 className="mt-3 text-base font-semibold">No posts yet</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {canPublish
                    ? "Share the first notice with the church."
                    : "News from the church will appear here."}
                </p>
              </div>
            </section>
          ) : (
            <section aria-label="Posts" className="grid gap-3">
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

          {feed.totalPages > 1 ? (
            <nav
              aria-label="Feed pages"
              className="flex items-center justify-between text-sm"
            >
              {feed.page > 1 ? (
                <Link
                  className={pageLink}
                  href={`${feedPath}?page=${feed.page - 1}`}
                >
                  <FiChevronLeft aria-hidden />
                  Newer
                </Link>
              ) : (
                <span />
              )}
              <span className="text-slate-500">
                Page {feed.page} of {feed.totalPages}
              </span>
              {feed.page < feed.totalPages ? (
                <Link
                  className={pageLink}
                  href={`${feedPath}?page=${feed.page + 1}`}
                >
                  Older
                  <FiChevronRight aria-hidden />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </div>

        <FeedSidebar
          canModerate={feed.canModerate}
          canPublish={canPublish}
          portal={portal}
        />
      </div>
    </div>
  );
}
