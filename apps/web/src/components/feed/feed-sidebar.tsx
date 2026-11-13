import Link from "next/link";
import {
  FiArrowUpRight,
  FiCalendar,
  FiFlag,
  FiHeart,
  FiPlus,
  FiShield,
} from "react-icons/fi";

import {
  ANNOUNCEMENT_PORTALS,
  type AnnouncementPortal,
} from "@/lib/announcements";
import { feedBasePath } from "@/lib/feed";

const RULES = [
  "Be kind and speak with grace.",
  "Keep comments on the post's topic.",
  "No private details of other members.",
  "Report anything that needs a pastor's attention.",
];

/** Reddit-style community panel beside the feed. */
export function FeedSidebar({
  portal,
  canPublish,
  canModerate,
}: {
  portal: AnnouncementPortal;
  canPublish: boolean;
  canModerate: boolean;
}) {
  const feedPath = feedBasePath(portal);
  return (
    <aside
      aria-label="About this community"
      className="grid min-w-0 content-start gap-4 xl:sticky xl:top-6 xl:self-start"
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold text-black">
          <FiHeart aria-hidden /> OUR CHURCH, CONNECTED
        </div>
        <div className="p-4">
          <h2 className="text-base font-bold text-slate-900">
            A place to stay close.
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            News and notices from our pastors, administrators, and department
            leaders. React, comment, and stay in the loop.
          </p>
          <div className="mt-4 grid gap-2">
            {canPublish ? (
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-black px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                href={`${feedPath}?compose=1`}
              >
                <FiPlus aria-hidden />
                Create post
              </Link>
            ) : null}
            <Link
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              href={ANNOUNCEMENT_PORTALS[portal].basePath}
            >
              <FiCalendar aria-hidden />
              Church events
              <FiArrowUpRight aria-hidden className="ml-auto" />
            </Link>
            {canModerate ? (
              <Link
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                href={`${feedPath}/reports`}
              >
                <FiFlag aria-hidden />
                Reported comments
              </Link>
            ) : null}
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FiShield aria-hidden className="text-black" /> Community
          guidelines
        </h2>
        <ol className="mt-2 divide-y divide-slate-100 text-sm text-slate-700">
          {RULES.map((rule, index) => (
            <li className="flex gap-3 py-2" key={rule}>
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                {index + 1}
              </span>
              {rule}
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
