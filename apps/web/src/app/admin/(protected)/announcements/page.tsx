import { AnnouncementsBoard } from "@/components/announcements/announcements-board";
import {
  loadAnnouncementBoard,
  type AnnouncementBoardSearchParams,
} from "@/lib/announcement-board-data";

import { getAdminResource } from "../registrations/admin-api";

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<AnnouncementBoardSearchParams>;
}) {
  const board = await loadAnnouncementBoard(
    (path) => getAdminResource(path),
    await searchParams,
  );

  return (
    <main className="min-h-screen bg-[#e9edee] px-4 py-8 sm:px-5 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <AnnouncementsBoard portal="admin" {...board} />
      </div>
    </main>
  );
}
