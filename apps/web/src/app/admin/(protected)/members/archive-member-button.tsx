"use client";

import { FiArchive } from "react-icons/fi";

import { AdminActionButton } from "@/components/admin-action-button";

import { archiveMember } from "./actions";

export function ArchiveMemberButton({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  return (
    <form
      action={archiveMember}
      className="inline"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Archive ${memberName}? They will lose account access and leave their current departments. Their history is kept.`,
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input name="memberId" type="hidden" value={memberId} />
      <input name="returnTo" type="hidden" value="list" />
      <AdminActionButton
        aria-label={`Archive ${memberName}`}
        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-[13px] font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        pendingLabel="Archiving…"
      >
        <FiArchive aria-hidden />
        Archive
      </AdminActionButton>
    </form>
  );
}
