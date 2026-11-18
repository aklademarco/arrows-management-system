"use client";

import { useState } from "react";
import { FiXCircle } from "react-icons/fi";

import { cancelEvent } from "@/app/announcement-actions";
import { ReasonPicker } from "@/components/feed/reason-picker";
import { Sheet } from "@/components/feed/sheet";
import type { PublishingPortal } from "@/lib/announcements";

export const CANCEL_REASONS = [
  "Bad weather",
  "The venue is no longer available",
  "Postponed: a new date is coming",
  "Not enough people available",
];

/** Opens a sheet to cancel an event by tapping a reason. */
export function CancelEventButton({
  id,
  title,
  portal,
}: {
  id: string;
  title: string;
  portal: PublishingPortal;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50"
        onClick={() => setOpen(true)}
        type="button"
      >
        <FiXCircle aria-hidden />
        Cancel event
      </button>
      <Sheet
        label={`Cancel ${title}`}
        onClose={() => setOpen(false)}
        open={open}
      >
        <ReasonPicker
          action={cancelEvent}
          detail="Members will see it marked as cancelled with your reason. Copies already saved to calendars won't update by themselves."
          doneDetail="Members now see this event as cancelled."
          doneTitle="Event cancelled"
          fields={{ portal, id }}
          onClose={() => setOpen(false)}
          reasons={CANCEL_REASONS}
          title="Why is it cancelled?"
        />
      </Sheet>
    </>
  );
}
