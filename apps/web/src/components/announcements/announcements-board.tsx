import Link from "next/link";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiInbox,
  FiPlus,
} from "react-icons/fi";

import {
  ANNOUNCEMENT_PORTALS,
  PUBLISHING_PORTALS,
  type Announcement,
  type AnnouncementPage,
  type AnnouncementPortal,
  type AnnouncementView,
  type PublishingPortal,
} from "@/lib/announcements";

import { AnnouncementCard } from "./announcement-card";
import { AnnouncementForm } from "./announcement-form";

type AnnouncementsBoardProps = {
  portal: AnnouncementPortal;
  page: AnnouncementPage;
  view: AnnouncementView;
  /** Shows the create form. */
  composing?: boolean;
  /** Shows the edit form for this post. */
  editing?: Announcement | null;
  feedback?: { kind: "success" | "error"; message: string } | null;
};

function isPublishingPortal(
  portal: AnnouncementPortal,
): portal is PublishingPortal {
  return (PUBLISHING_PORTALS as readonly string[]).includes(portal);
}

const KIND_FILTERS = [
  { value: undefined, label: "All" },
  { value: "EVENT", label: "Events" },
  { value: "ANNOUNCEMENT", label: "Announcements" },
] as const;

export function AnnouncementsBoard({
  portal,
  page,
  view,
  composing = false,
  editing = null,
  feedback = null,
}: AnnouncementsBoardProps) {
  const { basePath } = ANNOUNCEMENT_PORTALS[portal];
  const manage = isPublishingPortal(portal) ? { portal, basePath } : undefined;
  const canPublish = Boolean(manage) && page.canPublish;

  const href = (changes: Partial<AnnouncementView>) => {
    const next = { ...view, page: 1, ...changes };
    const query = new URLSearchParams();
    if (next.scope === "past") query.set("scope", "past");
    if (next.kind) query.set("kind", next.kind);
    if (next.page > 1) query.set("page", String(next.page));
    const text = query.toString();
    return text ? `${basePath}?${text}` : basePath;
  };

  const tabClass = (active: boolean) =>
    `inline-flex h-9 items-center border-b-2 px-1 text-sm font-medium transition ${active ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`;
  const chipClass = (active: boolean) =>
    `inline-flex h-8 items-center rounded-full border px-3 text-[13px] font-medium transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`;

  return (
    <div className="text-slate-900">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Announcements &amp; events
            </h1>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {page.total}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {view.scope === "past"
              ? "Events and announcements that have already happened."
              : "What's coming up at church. No check-in needed."}
          </p>
        </div>
        {canPublish && !composing && !editing ? (
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            href={`${basePath}?compose=1`}
          >
            <FiPlus aria-hidden />
            New post
          </Link>
        ) : null}
      </header>

      {feedback ? (
        <p
          className={`mt-5 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${feedback.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
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

      {manage && (editing || (composing && canPublish)) ? (
        <div className="mt-6">
          <AnnouncementForm
            basePath={basePath}
            initial={editing ?? undefined}
            key={editing?.id ?? "new"}
            portal={manage.portal}
          />
        </div>
      ) : null}

      <nav
        aria-label="Announcement views"
        className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200"
      >
        <div className="flex gap-5">
          <Link
            aria-current={view.scope === "upcoming" ? "page" : undefined}
            className={tabClass(view.scope === "upcoming")}
            href={href({ scope: "upcoming" })}
          >
            Upcoming
          </Link>
          <Link
            aria-current={view.scope === "past" ? "page" : undefined}
            className={tabClass(view.scope === "past")}
            href={href({ scope: "past" })}
          >
            Past
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 pb-2">
          {KIND_FILTERS.map((filter) => (
            <Link
              aria-current={view.kind === filter.value ? "true" : undefined}
              className={chipClass(view.kind === filter.value)}
              href={href({ kind: filter.value })}
              key={filter.label}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </nav>

      {page.items.length === 0 ? (
        <section className="mt-6 grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div>
            <FiInbox aria-hidden className="mx-auto text-4xl text-slate-300" />
            <h2 className="mt-3 text-base font-semibold">
              {view.scope === "past"
                ? "Nothing in the past yet"
                : "Nothing coming up yet"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {canPublish
                ? "Post an event or announcement for the church."
                : "Check back soon for church events and news."}
            </p>
          </div>
        </section>
      ) : (
        <section
          aria-label={view.scope === "past" ? "Past posts" : "Upcoming posts"}
          className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {page.items.map((item) => (
            <AnnouncementCard item={item} key={item.id} manage={manage} />
          ))}
        </section>
      )}

      {page.totalPages > 1 ? (
        <nav
          aria-label="Announcement pages"
          className="mt-8 flex items-center justify-between text-sm"
        >
          {page.page > 1 ? (
            <Link
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 font-medium text-slate-700 hover:bg-slate-50"
              href={href({ page: page.page - 1 })}
            >
              <FiChevronLeft aria-hidden />
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-slate-500">
            Page {page.page} of {page.totalPages}
          </span>
          {page.page < page.totalPages ? (
            <Link
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 font-medium text-slate-700 hover:bg-slate-50"
              href={href({ page: page.page + 1 })}
            >
              Next
              <FiChevronRight aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
