import { AnnouncementsBoard } from "@/components/announcements/announcements-board";
import {
  loadAnnouncementBoard,
  type AnnouncementBoardSearchParams,
} from "@/lib/announcement-board-data";

import { getPastorResource } from "../pastor-api";

export default async function PastorAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<AnnouncementBoardSearchParams>;
}) {
  const board = await loadAnnouncementBoard(
    getPastorResource,
    await searchParams,
  );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-6xl">
        <AnnouncementsBoard portal="pastor" {...board} />
      </div>
    </main>
  );
}
