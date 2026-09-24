"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiBell,
  FiCheckCircle,
  FiGrid,
  FiMessageCircle,
  FiMusic,
  FiUsers,
} from "react-icons/fi";

const items = [
  { href: "/leader", label: "Overview", mobileLabel: "Home", icon: FiGrid },
  {
    href: "/leader/attendance",
    label: "Attendance",
    mobileLabel: "Attend",
    icon: FiCheckCircle,
  },
  {
    href: "/leader/people",
    label: "People",
    mobileLabel: "People",
    icon: FiUsers,
  },
  {
    href: "/leader/messages",
    label: "Messages",
    mobileLabel: "Message",
    icon: FiMessageCircle,
  },
  {
    href: "/leader/ministry",
    label: "Ministry",
    mobileLabel: "Ministry",
    icon: FiMusic,
  },
  { href: "/leader/inbox", label: "Inbox", mobileLabel: "Inbox", icon: FiBell },
];

export function LeaderNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Leadership workspace"
      className={
        mobile
          ? "pointer-events-auto leader-mobile-nav mx-auto grid w-full max-w-xl grid-cols-6 rounded-[1.6rem] border border-white/20 p-1.5 backdrop-blur-xl"
          : "grid w-full gap-2"
      }
    >
      {items.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active =
          href === "/leader" ? pathname === href : pathname.startsWith(href);

        if (mobile) {
          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={`relative flex min-h-[3.8rem] min-w-0 flex-col items-center justify-center gap-1 rounded-[1.15rem] px-0.5 text-white transition active:scale-95 ${
                active
                  ? "bg-white/16 shadow-inner ring-1 ring-white/15"
                  : "hover:bg-white/10"
              }`}
              href={href}
              key={label}
            >
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1 h-1 w-5 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(190,242,100,0.75)]"
                />
              ) : null}
              <Icon aria-hidden="true" className="mt-1 text-[1.2rem]" />
              <span
                className={`max-w-full truncate text-[9px] font-bold leading-none ${active ? "text-white" : "text-purple-100"}`}
              >
                {mobileLabel}
              </span>
            </Link>
          );
        }

        return (
          <Link
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={`group relative grid size-12 place-items-center justify-self-center rounded-2xl text-xl text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/15 focus-visible:bg-white/15 ${
              active
                ? "bg-white/20 shadow-[0_8px_24px_rgba(36,0,70,0.24)] ring-1 ring-inset ring-white/15"
                : ""
            }`}
            href={href}
            key={label}
          >
            {active ? (
              <span
                aria-hidden="true"
                className="absolute -left-[1.05rem] h-7 w-1.5 rounded-r-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.75)]"
              />
            ) : null}
            <Icon aria-hidden="true" />
            <span className="pointer-events-none absolute left-[calc(100%+0.7rem)] z-50 whitespace-nowrap rounded-xl bg-[#240046] px-3 py-2 text-xs font-bold text-white opacity-0 shadow-xl transition group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:translate-x-0.5 group-focus-visible:opacity-100">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
