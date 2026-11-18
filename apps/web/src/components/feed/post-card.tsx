import Link from "next/link";
import { FiCalendar, FiMapPin, FiTag } from "react-icons/fi";

import {
  formatAnnouncementWhen,
  PUBLISHING_PORTALS,
  type AnnouncementPortal,
  type PublishingPortal,
} from "@/lib/announcements";
import {
  feedBasePath,
  feedComposePath,
  formatAge,
  formatPostedAt,
  type FeedPost,
} from "@/lib/feed";

import { Avatar } from "./avatar";
import { PostMenu } from "./post-menu";
import { ReactionBar } from "./reaction-bar";

function isPublishingPortal(
  portal: AnnouncementPortal,
): portal is PublishingPortal {
  return (PUBLISHING_PORTALS as readonly string[]).includes(portal);
}

/** Who may do what with a post, for its "…" menu. */
export function postPermissions(
  portal: AnnouncementPortal,
  post: FeedPost,
  canModerate: boolean,
) {
  const managePortal =
    post.canManage && isPublishingPortal(portal) ? portal : null;
  return {
    managePortal,
    moderatorPortal:
      canModerate && (portal === "admin" || portal === "pastor")
        ? portal
        : null,
    editHref: managePortal ? feedComposePath(managePortal, post.id) : undefined,
  } as const;
}

export function menuPost(post: FeedPost) {
  return {
    id: post.id,
    title: post.title,
    isPinned: post.isPinned,
    commentsClosed: post.commentsClosed,
  };
}

/** Theme, date, and place as small chips, like a link preview's details. */
export function PostDetails({ post }: { post: FeedPost }) {
  const when = post.startsAt ? formatAnnouncementWhen(post) : null;
  const chips = [
    post.theme ? { icon: <FiTag aria-hidden />, text: post.theme } : null,
    when ? { icon: <FiCalendar aria-hidden />, text: when } : null,
    post.locationName ? { icon: <FiMapPin aria-hidden />, text: post.locationName } : null,
  ].filter((chip) => chip !== null);
  if (chips.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <li
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
          key={chip.text}
        >
          {chip.icon}
          <span className="truncate">{chip.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** A photo at its natural shape, with rounded corners like X. */
export function PostPhoto({
  post,
  large = false,
}: {
  post: FeedPost;
  large?: boolean;
}) {
  if (!post.flyerUrl) return null;
  return (
    <a
      aria-label={`Open the full image for ${post.title}`}
      className="relative z-10 mt-3 block w-fit max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      href={post.flyerUrl}
      rel="noreferrer"
      target="_blank"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- natural aspect ratio from Cloudinary */}
      <img
        alt={`Image for ${post.title}`}
        className={`block h-auto max-w-full ${large ? "max-h-[680px]" : "max-h-[520px]"}`}
        decoding="async"
        loading={large ? "eager" : "lazy"}
        src={post.flyerUrl}
      />
    </a>
  );
}

/** One post as an X-style row: avatar on the left, everything else beside it. */
export function PostCard({
  portal,
  post,
  canModerate,
}: {
  portal: AnnouncementPortal;
  post: FeedPost;
  canModerate: boolean;
}) {
  const postPath = `${feedBasePath(portal)}/${post.id}`;
  const author = post.authorName ?? "Church office";
  const permissions = postPermissions(portal, post, canModerate);

  return (
    <article className="relative border-b border-slate-200 px-4 pb-1 pt-3 transition hover:bg-slate-50/70">
      {post.isPinned ? (
        <p className="mb-1 flex items-center gap-2 pl-7 text-[13px] font-semibold text-slate-500">
          <FiMapPin aria-hidden /> Pinned
        </p>
      ) : null}
      <div className="flex gap-3">
        <div className="shrink-0">
          <Avatar name={post.authorName} photoUrl={post.authorPhotoUrl} />
        </div>
        <div className="min-w-0 flex-1">
          <header className="flex items-start gap-1">
            <p className="flex min-w-0 flex-1 items-baseline gap-1 text-[15px] leading-5">
              <span className="truncate font-bold text-slate-900">{author}</span>
              <span aria-hidden className="text-slate-500">
                ·
              </span>
              <time
                className="shrink-0 text-slate-500"
                dateTime={post.createdAt}
                suppressHydrationWarning
                title={formatPostedAt(post.createdAt)}
              >
                {formatAge(post.createdAt).replace(" ago", "")}
              </time>
            </p>
            <div className="relative z-10 -mr-2 -mt-2">
              <PostMenu
                editHref={permissions.editHref}
                managePortal={permissions.managePortal}
                moderatorPortal={permissions.moderatorPortal}
                post={menuPost(post)}
                postHref={postPath}
              />
            </div>
          </header>

          <h2 className="mt-0.5 break-words text-[15px] font-semibold leading-5 text-slate-900">
            {/* The title link covers the whole post, so tapping anywhere opens it. */}
            <Link
              className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-black"
              href={postPath}
            >
              {post.title}
            </Link>
          </h2>
          {post.description ? (
            <p className="mt-0.5 line-clamp-4 whitespace-pre-line break-words text-[15px] leading-5 text-slate-800">
              {post.description}
            </p>
          ) : null}
          <PostDetails post={post} />
          <PostPhoto post={post} />

          <div className="relative z-10 mt-1">
            <ReactionBar
              commentCount={post.commentCount}
              commentHref={`${postPath}#reply`}
              counts={post.reactionCounts}
              mine={post.myReaction}
              portal={portal}
              postId={post.id}
              title={post.title}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
