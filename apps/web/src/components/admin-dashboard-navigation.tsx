"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { FiShield } from "react-icons/fi";
import { adminNavigation } from "./portal-navigation";

export function AdminDashboardNavigation({
  showAuditLogs,
  rail = false,
}: {
  showAuditLogs: boolean;
  rail?: boolean;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (rail) return;
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    const centerActiveTab = () => {
      nav.scrollLeft =
        active.offsetLeft -
        nav.offsetLeft -
        (nav.clientWidth - active.clientWidth) / 2;
    };
    centerActiveTab();
    const observer = new ResizeObserver(centerActiveTab);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [pathname, rail]);
  const links = showAuditLogs
    ? [
        ...adminNavigation,
        { href: "/admin/audit-logs", label: "Audit logs", icon: FiShield },
      ]
    : adminNavigation;
  return (
    <nav
      ref={navRef}
      aria-label={rail ? "Administration tools" : "Administration"}
      className={
        rail
          ? "flex flex-col items-center gap-2"
          : "relative flex max-w-full gap-1 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:thin]"
      }
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            title={rail ? label : undefined}
            className={`${rail ? "grid size-11 shrink-0 place-items-center rounded-full text-lg" : "inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-xs font-medium"} transition ${active ? "bg-[#202222] text-white shadow-sm" : "text-[#626969] hover:bg-white hover:text-black"}`}
          >
            {rail ? <Icon aria-hidden="true" /> : label}
          </Link>
        );
      })}
    </nav>
  );
}
