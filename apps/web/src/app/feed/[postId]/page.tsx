import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ANNOUNCEMENT_PORTALS, type AnnouncementPortal } from "@/lib/announcements";
import { feedBasePath, isUuid } from "@/lib/feed";

/** Most specific workspace first, matching the notifications redirect. */
const PORTAL_ORDER: AnnouncementPortal[] = ["pastor", "leader", "admin", "member"];

/** Notification links point here; send the reader to their own portal. */
export default async function FeedPostDestination({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  if (!isUuid(postId)) notFound();
  const jar = await cookies();
  const portal = PORTAL_ORDER.find((name) =>
    jar.has(ANNOUNCEMENT_PORTALS[name].cookie),
  );
  if (!portal) redirect("/login");
  redirect(`${feedBasePath(portal)}/${postId}`);
}
