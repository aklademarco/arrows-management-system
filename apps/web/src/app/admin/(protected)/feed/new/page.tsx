import { PostComposer } from "@/components/feed/post-composer";
import { feedBasePath } from "@/lib/feed";
import { loadComposer } from "@/lib/feed-data";

export default async function AdminNewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { editing } = await loadComposer("admin", await searchParams);
  return (
    <PostComposer
      closeHref={feedBasePath("admin")}
      editing={editing}
      key={editing?.id ?? "new"}
      portal="admin"
    />
  );
}
