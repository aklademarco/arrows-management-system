"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiBarChart2,
  FiCalendar,
  FiGrid,
  FiHeart,
  FiUsers,
} from "react-icons/fi";

const items = [
  {
    href: "/pastor",
    label: "Overview",
    icon: FiGrid,
  },
  {
    href: "/pastor/members",
    label: "Members",
    icon: FiUsers,
  },
  {
    href: "/pastor/pastoral-care",
    label: "Pastoral Care",
    icon: FiHeart,
  },
  {
    href: "/pastor/attendance",
    label: "Attendance",
    icon: FiCalendar,
  },
  {
    href: "/pastor/reports",
    label: "Reports",
    icon: FiBarChart2,
  },
];

export function PastorNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Pastoral workspace"
      className={mobile ? "grid grid-cols-5 gap-1" : "grid gap-2"}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/pastor" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={
              mobile
                ? `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold ${
                    active ? "bg-purple-100 text-purple-700" : "text-slate-500"
                  }`
                : `group relative grid size-12 place-items-center rounded-2xl text-xl text-white transition hover:bg-white/15 ${
                    active ? "bg-white/20" : ""
                  }`
            }
            href={href}
            key={href}
          >
            <Icon aria-hidden="true" />

            {mobile && (
              <span className="text-center leading-tight">{label}</span>
            )}

            {!mobile && (
              <span className="pointer-events-none absolute left-16 z-50 whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                {label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
