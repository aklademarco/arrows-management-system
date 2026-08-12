"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiCalendar,
  FiGrid,
  FiHome,
  FiFileText,
  FiAward,
  FiBarChart2,
  FiMapPin,
  FiShield,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiImage,
  FiHeart,
  FiList,
} from "react-icons/fi";

const memberNavigation = [
  { href: "/member", label: "Home", icon: FiHome },
  { href: "/member/attendance", label: "Activity", icon: FiCalendar },
  { href: "/member/directory", label: "People", icon: FiUsers },
  { href: "/member/absences", label: "Absences", icon: FiFileText },
  { href: "/member/leaderboard", label: "Ranks", icon: FiAward },
  { href: "/member/media-hub", label: "Media hub", icon: FiImage },
  { href: "/member/profile", label: "Profile", icon: FiUser },
];

const adminNavigation = [
  { href: "/admin/dashboard", label: "Overview", icon: FiGrid },
  { href: "/admin/members", label: "Members", icon: FiUsers },
  { href: "/admin/registrations", label: "Approvals", icon: FiUserCheck },
  { href: "/admin/departments", label: "Departments", icon: FiGrid },
  { href: "/admin/events", label: "Events", icon: FiCalendar },
  { href: "/admin/liturgies", label: "Liturgies", icon: FiList },
  { href: "/admin/absences", label: "Absences", icon: FiFileText },
  { href: "/admin/pastoral-care", label: "Pastoral care", icon: FiHeart },
  { href: "/admin/reports", label: "Reports", icon: FiBarChart2 },
  { href: "/admin/geofence", label: "Geofence", icon: FiMapPin },
];
const superAdminNavigation = {
  href: "/admin/audit-logs",
  label: "Audit logs",
  icon: FiShield,
};

export function PortalNavigation({
  portal,
  mobile = false,
  showAuditLogs = false,
}: {
  portal: "member" | "admin";
  mobile?: boolean;
  showAuditLogs?: boolean;
}) {
  const pathname = usePathname();
  const navigation =
    portal === "member"
      ? mobile
        ? memberNavigation.filter(
            (item) =>
              item.href !== "/member/media-hub" &&
              item.href !== "/member/absences",
          )
        : memberNavigation
      : showAuditLogs
        ? [...adminNavigation, superAdminNavigation]
        : adminNavigation;

  return (
    <nav
      aria-label={portal === "member" ? "Member portal" : "Administration"}
      className={mobile ? "grid grid-cols-5" : "grid gap-1"}
    >
      {navigation.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== `/${portal}` && pathname.startsWith(`${href}/`));
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={
              mobile
                ? `flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-[11px] font-bold transition ${active ? "text-[#6b21a8]" : "text-slate-400"}`
                : `inline-flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? (portal === "admin" ? "bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/20" : "bg-purple-100 text-[#5b148d]") : portal === "admin" ? "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`
            }
            href={href}
            key={href}
          >
            <Icon
              aria-hidden="true"
              className={mobile ? "text-xl" : "text-lg"}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
