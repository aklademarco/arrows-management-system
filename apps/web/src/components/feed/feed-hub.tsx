import Link from "next/link";
import {
  FiCalendar,
  FiChevronRight,
  FiFlag,
  FiGrid,
  FiPlusSquare,
} from "react-icons/fi";

import type { PublishingPortal } from "@/lib/announcements";
import { feedMenuOptions } from "@/lib/feed";

const icons = {
  feed: FiGrid,
  create: FiPlusSquare,
  events: FiCalendar,
  reports: FiFlag,
};

/**
 * The menu publishers see when they open "Feed": pick what to do, like an
 * app's home screen. Options the viewer may not use are left out.
 */
export function FeedHub({
  portal,
  totalPosts,
  canPublish,
  canModerate,
  openReports,
}: {
  portal: PublishingPortal;
  totalPosts: number;
  canPublish: boolean;
  canModerate: boolean;
  openReports: number;
}) {
  const options = feedMenuOptions(portal, {
    canPublish,
    canModerate,
    totalPosts,
    openReports,
  });

  return (
    <div className="mx-auto w-full max-w-md text-slate-900">
      <header className="pb-6 pt-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Church feed</h1>
        <p className="mt-1 text-sm text-slate-500">
          What would you like to do?
        </p>
      </header>
      <nav aria-label="Feed options">
        <ul className="grid gap-3">
          {options.map((option) => {
            const Icon = icons[option.icon];
            return (
              <li key={option.title}>
                <Link
                  className={`group flex items-center gap-4 rounded-2xl border p-4 transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
                    option.primary
                      ? "border-black bg-black text-white hover:bg-slate-800"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                  href={option.href}
                >
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-full text-[22px] ${
                      option.primary ? "bg-white/15" : "bg-slate-100"
                    }`}
                  >
                    <Icon aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{option.title}</span>
                    <span
                      className={`block text-sm ${option.primary ? "text-white/70" : "text-slate-500"}`}
                    >
                      {option.detail}
                    </span>
                  </span>
                  {option.badge ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        option.primary
                          ? "bg-white text-black"
                          : option.title === "Reported comments"
                            ? "bg-red-600 text-white"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {option.badge}
                    </span>
                  ) : null}
                  <FiChevronRight
                    aria-hidden
                    className={`shrink-0 text-xl ${option.primary ? "text-white/70" : "text-slate-400"}`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
