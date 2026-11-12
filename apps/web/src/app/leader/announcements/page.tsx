import { AnnouncementsBoard } from "@/components/announcements/announcements-board";
import {
  loadAnnouncementBoard,
  type AnnouncementBoardSearchParams,
} from "@/lib/announcement-board-data";

import { getLeaderResource } from "../leader-api";

export default async function LeaderAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<AnnouncementBoardSearchParams>;
}) {
  const board = await loadAnnouncementBoard(
    getLeaderResource,
    await searchParams,
  );

  return (
    <main className="min-h-screen p-4 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-6xl">
        <AnnouncementsBoard portal="leader" {...board} />
      </div>
    </main>
  );
}
