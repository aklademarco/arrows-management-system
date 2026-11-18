"use client";

import { useState } from "react";
import { FiCalendar, FiDownload, FiExternalLink } from "react-icons/fi";

import { Sheet, SheetHeader, sheetOption } from "@/components/feed/sheet";

/**
 * One "Add to calendar" button that opens a sheet with the choices. Both
 * choices save a copy; ACMS remains the place for changes.
 */
export function AddToCalendar({
  title,
  googleCalendarUrl,
  icsHref,
}: {
  title: string;
  googleCalendarUrl: string;
  icsHref: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
        onClick={() => setOpen(true)}
        type="button"
      >
        <FiCalendar aria-hidden />
        Add to calendar
      </button>
      <Sheet
        label={`Add ${title} to your calendar`}
        onClose={() => setOpen(false)}
        open={open}
      >
        <SheetHeader
          detail="This saves a copy to your calendar. If the event changes or is cancelled, we'll show it here in the app, but your calendar copy won't update by itself."
          title="Add to your calendar"
        />
        <a
          className={`${sheetOption("strong")} gap-2`}
          href={googleCalendarUrl}
          onClick={() => setOpen(false)}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FiExternalLink aria-hidden />
          Google Calendar
        </a>
        <a
          className={`${sheetOption()} gap-2`}
          download
          href={icsHref}
          onClick={() => setOpen(false)}
        >
          <FiDownload aria-hidden />
          Apple, Outlook &amp; others (.ics)
        </a>
        <button
          className={sheetOption()}
          onClick={() => setOpen(false)}
          type="button"
        >
          Not now
        </button>
      </Sheet>
    </>
  );
}
