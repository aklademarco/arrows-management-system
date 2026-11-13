import { FeedView } from "@/components/feed/feed-view";
import { loadFeed, type FeedSearchParams } from "@/lib/feed-data";

export default async function AdminFeedPage({
  searchParams,
}: {
  searchParams: Promise<FeedSearchParams>;
}) {
  const data = await loadFeed("admin", await searchParams);
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <FeedView portal="admin" {...data} />
    </main>
  );
}
