"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiBell, FiGrid, FiMessageCircle, FiMusic, FiUsers } from "react-icons/fi";

const items = [
  { href: "/leader", label: "Overview", icon: FiGrid },
  { href: "/leader/people", label: "People", icon: FiUsers },
  { href: "/leader/messages", label: "Messages", icon: FiMessageCircle },
  { href: "/leader/ministry", label: "Ministry", icon: FiMusic },
  { href: "/leader/inbox", label: "Inbox", icon: FiBell },
];

export function LeaderNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Leadership workspace" className={mobile ? "grid grid-cols-5" : "grid gap-2"}>
      {items.map(({ href, label, icon: Icon }) => {
        const target = href.split("#")[0];
        const active = target === "/leader" ? pathname === "/leader" : pathname.startsWith(target);
        return <Link className={mobile ? `flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold ${active ? "text-[#6b21a8]" : "text-slate-400"}` : `grid size-11 place-items-center rounded-xl text-lg transition ${active ? "bg-purple-100 text-[#6b21a8]" : "text-slate-400 hover:bg-purple-50 hover:text-[#6b21a8]"}`} href={href} key={label} title={label}><Icon /><span className={mobile ? "block" : "sr-only"}>{label}</span></Link>;
      })}
    </nav>
  );
}
