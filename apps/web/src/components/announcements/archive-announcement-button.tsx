"use client";

import { FiArchive } from "react-icons/fi";

import { archiveAnnouncement } from "@/app/announcement-actions";
import { AdminActionButton } from "@/components/admin-action-button";
import type { PublishingPortal } from "@/lib/announcements";

export function ArchiveAnnouncementButton({
  id,
  title,
  portal,
  destination = "events",
  size = "sm",
}: {
  id: string;
  title: string;
  portal: PublishingPortal;
  /** Which page to return to afterwards. */
  destination?: "events" | "feed";
  /** "lg" gives a full-size tap target for pages built for phones. */
  size?: "sm" | "lg";
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
      <input name="destination" type="hidden" value={destination} />
      <AdminActionButton
        aria-label={`Archive ${title}`}
        className={`inline-flex items-center gap-1.5 border border-slate-200 bg-white font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 ${size === "lg" ? "min-h-11 rounded-xl px-4 text-sm" : "h-8 rounded-md px-2.5 text-xs"}`}
        pendingLabel="Archiving…"
      >
        <FiArchive aria-hidden />
        Archive
      </AdminActionButton>
    </form>
  );
}
