import { FeedHub } from "@/components/feed/feed-hub";
import { loadFeedHub } from "@/lib/feed-data";

export default async function PastorFeedMenuPage() {
  const hub = await loadFeedHub("pastor");
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <FeedHub portal="pastor" {...hub} />
    </main>
  );
}
