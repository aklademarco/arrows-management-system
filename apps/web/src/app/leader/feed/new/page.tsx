import { PostComposer } from "@/components/feed/post-composer";
import { feedBasePath } from "@/lib/feed";
import { loadComposer } from "@/lib/feed-data";

export default async function LeaderNewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { editing } = await loadComposer("leader", await searchParams);
  return (
    <PostComposer
      closeHref={feedBasePath("leader")}
      editing={editing}
      key={editing?.id ?? "new"}
      portal="leader"
    />
  );
}
