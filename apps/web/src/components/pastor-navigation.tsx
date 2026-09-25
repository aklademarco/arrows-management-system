"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FiBarChart2,
  FiCalendar,
  FiGrid,
  FiHeart,
  FiLayers,
  FiMessageCircle,
  FiMoreHorizontal,
  FiUsers,
} from "react-icons/fi";

const primaryItems = [
  {
    href: "/pastor",
    label: "Overview",
    mobileLabel: "Home",
    icon: FiGrid,
  },
  {
    href: "/pastor/members",
    label: "Members",
    mobileLabel: "Members",
    icon: FiUsers,
  },
  {
    href: "/pastor/pastoral-care",
    label: "Pastoral Care",
    mobileLabel: "Care",
    icon: FiHeart,
  },
  {
    href: "/pastor/attendance",
    label: "Attendance",
    mobileLabel: "Attendance",
    icon: FiCalendar,
  },
];

const secondaryItems = [
  {
    href: "/pastor/reports",
    label: "Reports",
    icon: FiBarChart2,
  },
  {
    href: "/pastor/departments",
    label: "Departments",
    icon: FiLayers,
  },
  {
    href: "/pastor/messages",
    label: "Messages",
    icon: FiMessageCircle,
  },
];

const allItems = [...primaryItems, ...secondaryItems];

function isActive(pathname: string, href: string) {
  return href === "/pastor" ? pathname === href : pathname.startsWith(href);
}

export function PastorNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!mobile) {
    return (
      <nav aria-label="Pastoral workspace" className="grid gap-2">
        {allItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`group relative grid size-12 place-items-center rounded-2xl text-xl text-white transition ${
                active ? "bg-white/20" : "hover:bg-white/15"
              }`}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" />

              <span className="pointer-events-none absolute left-16 z-50 whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }

  const moreActive = secondaryItems.some((item) =>
    isActive(pathname, item.href),
  );

  return (
    <div className="relative">
      {moreOpen && (
        <>
          <button
            aria-label="Close more menu"
            className="fixed inset-0 bottom-20 z-40"
            onClick={() => setMoreOpen(false)}
            type="button"
          />

          <div className="absolute bottom-[calc(100%+12px)] right-0 z-50 w-64 overflow-hidden rounded-2xl border border-purple-100 bg-white p-2 shadow-2xl">
            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              More
            </p>

            <div className="grid gap-1">
              {secondaryItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);

                return (
                  <Link
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                      active
                        ? "bg-purple-100 text-purple-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    href={href}
                    key={href}
                    onClick={() => setMoreOpen(false)}
                  >
                    <span
                      className={`grid size-9 place-items-center rounded-xl ${
                        active
                          ? "bg-white text-purple-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon aria-hidden="true" />
                    </span>

                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <nav
        aria-label="Pastoral mobile navigation"
        className="grid grid-cols-5 gap-1"
      >
        {primaryItems.map(({ href, mobileLabel, icon: Icon }) => {
          const active = isActive(pathname, href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition ${
                active ? "text-purple-700" : "text-slate-500"
              }`}
              href={href}
              key={href}
              onClick={() => setMoreOpen(false)}
            >
              <Icon aria-hidden="true" className="text-xl" />

              <span>{mobileLabel}</span>
            </Link>
          );
        })}

        <button
          aria-expanded={moreOpen}
          aria-label="More navigation options"
          className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition ${
            moreActive || moreOpen ? "text-purple-700" : "text-slate-500"
          }`}
          onClick={() => setMoreOpen((open) => !open)}
          type="button"
        >
          <FiMoreHorizontal aria-hidden="true" className="text-xl" />

          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
