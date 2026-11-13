import Link from "next/link";
import { FiArrowLeft, FiLock, FiMapPin } from "react-icons/fi";

import type { AnnouncementPortal } from "@/lib/announcements";
import {
  feedBasePath,
  feedListPath,
  FEED_REACTIONS,
  formatPostedAt,
  type CommentPage,
  type FeedPost,
} from "@/lib/feed";

import { Avatar } from "./avatar";
import { CommentComposer } from "./comment-composer";
import { CommentItem } from "./comment-item";
import { menuPost, PostDetails, postPermissions, PostPhoto } from "./post-card";
import { PostMenu } from "./post-menu";
import { ReactionBar } from "./reaction-bar";

/** One post and its replies, laid out like an X post page. */
export function PostView({
  portal,
  post,
  comments,
}: {
  portal: AnnouncementPortal;
  post: FeedPost;
  comments: CommentPage;
}) {
  const postPath = `${feedBasePath(portal)}/${post.id}`;
  const canModerate = post.canModerate === true;
  const permissions = postPermissions(portal, post, canModerate);
  const author = post.authorName ?? "Church office";
  const totalReactions = FEED_REACTIONS.reduce(
    (sum, { value }) => sum + post.reactionCounts[value],
    0,
  );

  return (
    <div className="-mx-4 -mt-6 min-h-screen bg-white text-slate-900 sm:mx-auto sm:mt-0 sm:max-w-[600px] sm:border-x sm:border-slate-200">
      <header className="z-20 flex h-[53px] items-center gap-6 border-b border-slate-200 bg-white/85 px-2 backdrop-blur-md lg:sticky lg:top-0">
        <Link
          aria-label="Back to the feed"
          className="grid size-10 place-items-center rounded-full text-xl transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-black"
          href={feedListPath(portal)}
        >
          <FiArrowLeft aria-hidden />
        </Link>
        <p className="text-xl font-bold tracking-tight">Post</p>
      </header>

      <article className="px-4 pt-3">
        {post.isPinned ? (
          <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-500">
            <FiMapPin aria-hidden /> Pinned
          </p>
        ) : null}
        <div className="flex items-center gap-3">
          <Avatar name={post.authorName} photoUrl={post.authorPhotoUrl} />
          <p className="min-w-0 flex-1 truncate text-[15px] font-bold">{author}</p>
          <PostMenu
            editHref={permissions.editHref}
            managePortal={permissions.managePortal}
            moderatorPortal={permissions.moderatorPortal}
            post={menuPost(post)}
          />
        </div>

        <h1 className="mt-3 break-words text-xl font-bold leading-7">{post.title}</h1>
        {post.description ? (
          <p className="mt-1 whitespace-pre-line break-words text-[17px] leading-6 text-slate-900">
            {post.description}
          </p>
        ) : null}
        <PostDetails post={post} />
        <PostPhoto large post={post} />

        <p className="mt-4 text-[15px] text-slate-500">
          <time dateTime={post.createdAt} suppressHydrationWarning>
            {formatPostedAt(post.createdAt)}
          </time>
        </p>

        <p className="mt-3 flex gap-5 border-t border-slate-200 py-3 text-[15px] text-slate-500">
          <span>
            <span className="font-bold text-slate-900">{post.commentCount}</span>{" "}
            {post.commentCount === 1 ? "Comment" : "Comments"}
          </span>
          <span>
            <span className="font-bold text-slate-900">{totalReactions}</span>{" "}
            {totalReactions === 1 ? "Reaction" : "Reactions"}
          </span>
        </p>

        <div className="border-y border-slate-200 py-0.5">
          <ReactionBar
            commentCount={post.commentCount}
            commentHref="#reply"
            counts={post.reactionCounts}
            mine={post.myReaction}
            portal={portal}
            postId={post.id}
            title={post.title}
          />
        </div>
      </article>

      <div className="border-b border-slate-200 px-4 py-3">
        {post.commentsClosed ? (
          <p className="flex items-center gap-2 text-[15px] text-slate-500">
            <FiLock aria-hidden /> Replies are turned off for this post.
          </p>
        ) : (
          <CommentComposer portal={portal} postId={post.id} />
        )}
      </div>

      <section aria-label="Replies" id="comments">
        {comments.page > 1 ? (
          <Link
            className="block border-b border-slate-200 py-3 text-center text-[15px] font-medium hover:bg-slate-50"
            href={`${postPath}?page=${comments.page - 1}#comments`}
          >
            Show earlier replies
          </Link>
        ) : null}

        {comments.items.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px] text-slate-500">
            {post.commentsClosed ? "No replies." : "No replies yet. Start the conversation."}
          </p>
        ) : (
          <ol>
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

        {comments.page < comments.totalPages ? (
          <Link
            className="block border-b border-slate-200 py-3 text-center text-[15px] font-medium hover:bg-slate-50"
            href={`${postPath}?page=${comments.page + 1}#comments`}
          >
            Show more replies
          </Link>
        ) : null}
      </section>
    </div>
  );
}
