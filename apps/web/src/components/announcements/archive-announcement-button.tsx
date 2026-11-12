"use client";

import { FiArchive } from "react-icons/fi";

import { archiveAnnouncement } from "@/app/announcement-actions";
import { AdminActionButton } from "@/components/admin-action-button";
import type { PublishingPortal } from "@/lib/announcements";

export function ArchiveAnnouncementButton({
  id,
  title,
  portal,
}: {
  id: string;
  title: string;
  portal: PublishingPortal;
}) {
  return (
    <form
      action={archiveAnnouncement}
      onSubmit={(event) => {
        if (!window.confirm(`Archive "${title}"? Members will no longer see it.`))
          event.preventDefault();
      }}
    >
      <input name="id" type="hidden" value={id} />
      <input name="portal" type="hidden" value={portal} />
      <AdminActionButton
        aria-label={`Archive ${title}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        pendingLabel="Archiving…"
      >
        <FiArchive aria-hidden />
        Archive
      </AdminActionButton>
    </form>
  );
}
