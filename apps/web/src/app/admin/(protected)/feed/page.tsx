import { FeedHub } from "@/components/feed/feed-hub";
import { loadFeedHub } from "@/lib/feed-data";

export default async function AdminFeedMenuPage() {
  const hub = await loadFeedHub("admin");
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <FeedHub portal="admin" {...hub} />
    </main>
  );
}
