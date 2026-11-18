import Image from "next/image";
import Link from "next/link";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiMapPin,
  FiVideo,
} from "react-icons/fi";

import {
  ANNOUNCEMENT_PORTALS,
  PUBLISHING_PORTALS,
  announcementDateBadge,
  eventCalendarPath,
  formatAnnouncementWhen,
  timeZoneLabel,
  type Announcement,
  type AnnouncementPortal,
  type PublishingPortal,
} from "@/lib/announcements";

import { AddToCalendar } from "./add-to-calendar";
import { ArchiveAnnouncementButton } from "./archive-announcement-button";
import { CancelEventButton } from "./cancel-event-button";

function isPublishingPortal(
  portal: AnnouncementPortal,
): portal is PublishingPortal {
  return (PUBLISHING_PORTALS as readonly string[]).includes(portal);
}

export function EventDetail({
  portal,
  event,
  feedback,
}: {
  portal: AnnouncementPortal;
  event: Announcement;
  feedback: { kind: "success" | "error"; message: string } | null;
}) {
  const { basePath } = ANNOUNCEMENT_PORTALS[portal];
  const cancelled = Boolean(event.cancelledAt);
  const when = formatAnnouncementWhen(event);
  const badge = announcementDateBadge(event.startsAt);
  const managePortal =
    isPublishingPortal(portal) && event.canManage ? portal : null;

  return (
    <article className="mx-auto max-w-2xl text-slate-900">
      <Link
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 hover:text-black"
        href={basePath}
      >
        <FiArrowLeft aria-hidden />
        Church events
      </Link>

      {feedback ? (
        <p
          className={`mt-2 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${feedback.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
          role={feedback.kind === "success" ? "status" : "alert"}
        >
          {feedback.kind === "success" ? (
            <FiCheckCircle aria-hidden className="mt-0.5 shrink-0" />
          ) : (
            <FiAlertCircle aria-hidden className="mt-0.5 shrink-0" />
          )}
          {feedback.message}
        </p>
      ) : null}

      {cancelled ? (
        <div
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800"
          role="status"
        >
          <p className="flex items-center gap-2 text-sm font-bold">
            <FiAlertCircle aria-hidden />
            This event has been cancelled
          </p>
          {event.cancellationReason ? (
            <p className="mt-1 text-sm">Reason: {event.cancellationReason}</p>
          ) : null}
        </div>
      ) : null}

      <div className="relative mt-3 overflow-hidden rounded-2xl bg-slate-100">
        {event.flyerUrl ? (
          <a
            aria-label={`Open the full flyer for ${event.title}`}
            className="relative block aspect-[4/5] max-h-[70vh] w-full"
            href={event.flyerUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Image
              alt={`Flyer for ${event.title}`}
              className={`object-contain ${cancelled ? "opacity-50 grayscale" : ""}`}
              fill
              priority
              sizes="(min-width: 672px) 672px, 100vw"
              src={event.flyerUrl}
              unoptimized
            />
          </a>
        ) : (
          <div
            aria-hidden
            className="grid aspect-[16/9] place-items-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400"
          >
            <FiCalendar className="text-5xl" />
          </div>
        )}
        {badge ? (
          <span className="absolute left-3 top-3 grid min-w-14 rounded-xl bg-white/95 px-2 py-2 text-center leading-none shadow-sm ring-1 ring-black/5">
            <span className="text-xl font-bold">{badge.day}</span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {badge.month}
            </span>
          </span>
        ) : null}
      </div>

      <header className="mt-5">
        <h1
          className={`text-2xl font-bold leading-tight tracking-tight sm:text-3xl ${cancelled ? "text-slate-500 line-through decoration-2" : ""}`}
        >
          {event.title}
        </h1>
        {event.theme ? (
          <p className="mt-1.5 text-base italic text-slate-600">
            {event.theme}
          </p>
        ) : null}
      </header>

      <ul className="mt-5 grid gap-4">
        {when ? (
          <li className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100">
              <FiCalendar aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold">{when}</span>
              <span className="block text-xs text-slate-500">
                {timeZoneLabel(event.timeZone, event.startsAt)}
              </span>
            </span>
          </li>
        ) : null}
        {event.locationName ? (
          <li className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100">
              <FiMapPin aria-hidden />
            </span>
            <span className="self-center text-sm font-semibold">
              {event.locationName}
            </span>
          </li>
        ) : null}
        {event.onlineUrl && !cancelled ? (
          <li className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100">
              <FiVideo aria-hidden />
            </span>
            <a
              className="self-center text-sm font-semibold underline underline-offset-4"
              href={event.onlineUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Join online
            </a>
          </li>
        ) : null}
      </ul>

      {event.googleCalendarUrl ? (
        <div className="mt-6">
          <AddToCalendar
            googleCalendarUrl={event.googleCalendarUrl}
            icsHref={eventCalendarPath(portal, event.id)}
            title={event.title}
          />
        </div>
      ) : null}

      {event.description ? (
        <p className="mt-6 whitespace-pre-line text-[15px] leading-7 text-slate-800">
          {event.description}
        </p>
      ) : null}

      <p className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
        {event.authorName ? `Posted by ${event.authorName}` : "Church office"}
        {" · "}No check-in needed for this event.
      </p>

      {managePortal ? (
        <section
          aria-label="Manage this event"
          className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4"
        >
          {!cancelled ? (
            <>
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                href={`${basePath}?edit=${event.id}`}
              >
                <FiEdit2 aria-hidden />
                Edit
              </Link>
              <CancelEventButton
                id={event.id}
                portal={managePortal}
                title={event.title}
              />
            </>
          ) : null}
          <ArchiveAnnouncementButton
            id={event.id}
            portal={managePortal}
            size="lg"
            title={event.title}
          />
        </section>
      ) : null}
    </article>
  );
}
