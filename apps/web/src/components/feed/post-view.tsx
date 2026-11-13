import Link from "next/link";
import { FiArrowLeft, FiLock } from "react-icons/fi";

import type { AnnouncementPortal } from "@/lib/announcements";
import { feedBasePath, type CommentPage, type FeedPost } from "@/lib/feed";

import { CommentComposer } from "./comment-composer";
import { CommentItem } from "./comment-item";
import { PostCard } from "./post-card";

/** One post with its comment thread, like a Reddit post page. */
export function PostView({
  portal,
  post,
  comments,
}: {
  portal: AnnouncementPortal;
  post: FeedPost;
  comments: CommentPage;
}) {
  const feedPath = feedBasePath(portal);
  const postPath = `${feedPath}/${post.id}`;
  const canModerate = post.canModerate === true;

  return (
    <div className="mx-auto grid max-w-3xl gap-4 text-slate-900">
      <Link
        className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        href={feedPath}
      >
        <FiArrowLeft aria-hidden />
        Back to the feed
      </Link>

      <PostCard canModerate={canModerate} detail portal={portal} post={post} />

      <section
        aria-labelledby="comments-heading"
        className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5"
        id="comments"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <h2
            className="text-lg font-bold tracking-tight"
            id="comments-heading"
          >
            Conversation{" "}
            <span className="ml-1 text-sm font-medium text-slate-500">
              ({comments.total})
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Keep it kind. Keep it thoughtful.
          </p>
        </div>
        {post.commentsClosed ? (
          <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <FiLock aria-hidden />
            Comments are closed on this post.
          </p>
        ) : (
          <CommentComposer portal={portal} postId={post.id} />
        )}

        {comments.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {post.commentsClosed
              ? "No comments."
              : "No comments yet. Be the first to share a thought."}
          </p>
        ) : (
          <ol className="mt-2">
            {comments.items.map((comment) => (
              <CommentItem
                canModerate={canModerate}
                comment={comment}
                commentsClosed={post.commentsClosed}
                key={comment.id}
                portal={portal}
                postId={post.id}
              />
            ))}
          </ol>
        )}

        {comments.totalPages > 1 ? (
          <nav
            aria-label="Comment pages"
            className="mt-4 flex justify-between text-sm font-semibold"
          >
            {comments.page > 1 ? (
              <Link
                className="text-slate-600 hover:underline"
                href={`${postPath}?page=${comments.page - 1}#comments`}
              >
                Earlier comments
              </Link>
            ) : (
              <span />
            )}
            {comments.page < comments.totalPages ? (
              <Link
                className="text-slate-600 hover:underline"
                href={`${postPath}?page=${comments.page + 1}#comments`}
              >
                Later comments
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
