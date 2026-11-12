import { AnnouncementsBoard } from "@/components/announcements/announcements-board";
import {
  loadAnnouncementBoard,
  type AnnouncementBoardSearchParams,
} from "@/lib/announcement-board-data";

import { getMemberResource } from "../member-api";

export default async function MemberAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<AnnouncementBoardSearchParams>;
}) {
  const board = await loadAnnouncementBoard(
    getMemberResource,
    await searchParams,
  );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-6xl">
        <AnnouncementsBoard portal="member" {...board} />
      </div>
    </main>
  );
}
