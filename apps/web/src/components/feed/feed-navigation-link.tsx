"use client";

import Link from "next/link";
import { useId, useState, type ComponentProps } from "react";
import { FiCalendar, FiFlag, FiGrid, FiPlusSquare, FiX } from "react-icons/fi";

import type { AnnouncementPortal } from "@/lib/announcements";
import { feedBasePath, feedMenuOptions } from "@/lib/feed";
import { Sheet } from "./sheet";

const icons = {
  feed: FiGrid,
  create: FiPlusSquare,
  events: FiCalendar,
  reports: FiFlag,
};

/** Feed opens an action sheet; other navigation items remain ordinary links. */
export function FeedNavigationLink({
  portal,
  href,
  children,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { portal: AnnouncementPortal }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (portal === "member" || href !== feedBasePath(portal)) {
    return (
      <Link {...props} href={href} onClick={onClick}>
        {children}
      </Link>
    );
  }

  // These are navigation choices. Destination loaders and the API enforce live
  // account, publishing, and moderation permissions before allowing an action.
  const options = feedMenuOptions(portal, {
    canPublish: true,
    canModerate: portal === "admin" || portal === "pastor",
  });

  return (
    <>
      <button
        aria-controls={id}
        aria-current={props["aria-current"]}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={props["aria-label"] ?? "Feed"}
        className={props.className}
        onClick={() => setOpen(true)}
        title={props.title}
        type="button"
      >
        {children}
      </button>
      <Sheet
        id={id}
        label="Feed actions"
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="max-h-[85dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div
            aria-hidden
            className="mx-auto mt-3 h-1 w-10 rounded-full bg-slate-300 sm:hidden"
          />
          <header className="relative border-b border-slate-100 px-14 py-5 text-center">
            <h2 className="text-lg font-bold">Church feed</h2>
            <p className="mt-1 text-xs text-slate-500">
              What would you like to do?
            </p>
            <button
              aria-label="Close feed actions"
              className="absolute right-3 top-4 grid size-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
              onClick={() => setOpen(false)}
              type="button"
            >
              <FiX aria-hidden />
            </button>
          </header>
          <nav aria-label="Feed actions" className="px-2 pt-2">
            {options.map(({ href: target, icon, title, detail }) => {
              const Icon = icons[icon];
              return (
                <Link
                  className="flex min-h-16 items-center gap-4 rounded-xl px-4 py-3 text-slate-900 transition hover:bg-purple-50 focus-visible:bg-purple-50 focus-visible:outline-2 focus-visible:outline-purple-700"
                  href={target}
                  key={target}
                  onClick={(event) => {
                    setOpen(false);
                    onClick?.(event);
                  }}
                >
                  <Icon aria-hidden className="shrink-0 text-2xl" />
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {detail}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </Sheet>
    </>
  );
}
