import { PostView } from "@/components/feed/post-view";
import { loadFeedPost } from "@/lib/feed-data";

export default async function LeaderFeedPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { postId } = await params;
  const data = await loadFeedPost("leader", postId, await searchParams);
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <PostView portal="leader" {...data} />
    </main>
  );
}
