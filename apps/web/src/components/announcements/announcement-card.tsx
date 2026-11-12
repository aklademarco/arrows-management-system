import Image from "next/image";
import Link from "next/link";
import {
  FiBell,
  FiCalendar,
  FiEdit2,
  FiMapPin,
  FiMaximize2,
} from "react-icons/fi";

import {
  announcementDateBadge,
  formatAnnouncementWhen,
  type Announcement,
  type PublishingPortal,
} from "@/lib/announcements";

import { ArchiveAnnouncementButton } from "./archive-announcement-button";

type AnnouncementCardProps = {
  item: Announcement;
  /** Set when the viewer is in a portal that can manage posts. */
  manage?: { portal: PublishingPortal; basePath: string };
};

export function AnnouncementCard({ item, manage }: AnnouncementCardProps) {
  const isEvent = item.kind === "EVENT";
  const when = formatAnnouncementWhen(item);
  const badge = announcementDateBadge(item.startsAt);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative">
        {item.flyerUrl ? (
          <a
            aria-label={`Open the full flyer for ${item.title}`}
            className="group relative block aspect-[4/5] bg-slate-100"
            href={item.flyerUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Image
              alt={`Flyer for ${item.title}`}
              className="object-contain"
              fill
              sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
              src={item.flyerUrl}
              unoptimized
            />
            <span className="absolute bottom-3 right-3 grid size-8 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              <FiMaximize2 aria-hidden />
            </span>
          </a>
        ) : (
          <div
            aria-hidden
            className={`grid aspect-[16/7] place-items-center ${isEvent ? "bg-gradient-to-br from-purple-100 to-amber-50 text-purple-400" : "bg-gradient-to-br from-sky-100 to-slate-50 text-sky-400"}`}
          >
            {isEvent ? (
              <FiCalendar className="text-4xl" />
            ) : (
              <FiBell className="text-4xl" />
            )}
          </div>
        )}
        {badge ? (
          <span className="absolute left-3 top-3 grid min-w-12 rounded-xl bg-white/95 px-2 py-1.5 text-center leading-none shadow-sm ring-1 ring-black/5">
            <span className="text-lg font-bold text-slate-900">{badge.day}</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700">
              {badge.month}
            </span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isEvent ? "bg-purple-50 text-purple-700" : "bg-sky-50 text-sky-700"}`}
          >
            {isEvent ? "Event" : "Announcement"}
          </span>
          <h3 className="mt-2 text-base font-semibold leading-snug text-slate-900">
            {item.title}
          </h3>
          {item.theme ? (
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-medium text-slate-500">Theme:</span>{" "}
              <span className="italic">{item.theme}</span>
            </p>
          ) : null}
        </div>

        {when || item.locationName ? (
          <ul className="grid gap-1.5 text-[13px] text-slate-600">
            {when ? (
              <li className="flex items-start gap-2">
                <FiCalendar aria-hidden className="mt-0.5 shrink-0 text-slate-400" />
                <span>{when}</span>
              </li>
            ) : null}
            {item.locationName ? (
              <li className="flex items-start gap-2">
                <FiMapPin aria-hidden className="mt-0.5 shrink-0 text-slate-400" />
                <span>{item.locationName}</span>
              </li>
            ) : null}
          </ul>
        ) : null}

        {item.description ? (
          <p className="line-clamp-5 whitespace-pre-line text-sm leading-6 text-slate-700">
            {item.description}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            {item.authorName ? `Posted by ${item.authorName}` : "Church office"}
          </p>
          {manage && item.canManage ? (
            <div className="flex items-center gap-1.5">
              <Link
                aria-label={`Edit ${item.title}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                href={`${manage.basePath}?edit=${item.id}`}
                scroll
              >
                <FiEdit2 aria-hidden />
                Edit
              </Link>
              <ArchiveAnnouncementButton
                id={item.id}
                portal={manage.portal}
                title={item.title}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
