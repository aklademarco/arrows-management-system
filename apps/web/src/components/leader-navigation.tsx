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
        return <Link className={mobile ? `flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold ${active ? "text-white" : "text-purple-200"}` : `grid size-11 place-items-center rounded-xl text-lg transition ${active ? "bg-white text-[#5b148d] shadow-lg" : "text-purple-200 hover:bg-white/10 hover:text-white"}`} href={href} key={label} title={label}><Icon /><span className={mobile ? "block" : "sr-only"}>{label}</span></Link>;
      })}
    </nav>
  );
}
