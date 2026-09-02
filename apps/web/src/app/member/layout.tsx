import Link from "next/link";
import Image from "next/image";
import { FiBell, FiLogOut } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PortalNavigation } from "@/components/portal-navigation";
import { memberLogout } from "../login/actions";
import { getMemberProfile, getMemberResource } from "./member-api";
import type { MemberProfile } from "./member-types";
import { redirect } from "next/navigation";

export default async function MemberLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [member, unread, account] = await Promise.all([
    getMemberProfile<MemberProfile>(),
    getMemberResource<{ count: number }>("/notifications/unread-count"),
    getMemberResource<{ roles: string[] }>("/auth/me"),
  ]);
  if (
    account.roles.includes("PASTOR") ||
    account.roles.includes("DEPARTMENT_LEADER")
  )
    redirect("/leader");
  const memberName = `${member.firstName} ${member.lastName}`;
  return (
    <div className="member-shell min-h-screen bg-[#f8f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-purple-100/80 bg-[#f8f7fb]/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <Link className="flex items-center gap-2" href="/member">
            <span className="relative block size-10 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-purple-100">
              <Image
                alt="The Arrows church logo"
                className="object-contain scale-[1.45"
                fill
                sizes="40px"
                src="/assets/arrows.PNG"
              />
            </span>
            <span>
              <span className="block text-sm font-black leading-none text-[#240046]">
                ARROWS
              </span>
              <span className="mt-1 block max-w-44 text-[10px] font-semibold leading-tight text-slate-400">
                In the hands of the mighty one
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <NotificationLink count={unread.count} compact />
            <Link aria-label="Open profile" href="/member/profile">
              <ProfileAvatar imageUrl={member.profilePhotoUrl} name={memberName} size="sm" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-375">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-purple-100 bg-white px-5 py-6 lg:flex">
          <Link className="flex items-center gap-3 px-2" href="/member">
            <span className="relative block size-12 shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(107,33,168,0.14)] ring-1 ring-purple-100">
              <Image
                alt="The Arrows church logo"
                className="object-contain scale-[1.45]"
                fill
                sizes="48px"
                src="/assets/arrows.PNG"
              />
            </span>
            <span>
              <span className="block font-black tracking-tight text-[#240046]">
                ARROWS
              </span>
              <span className="mt-0.5 block max-w-40 text-[10px] font-semibold leading-tight text-slate-400">
                In the hands of the mighty one
              </span>
            </span>
          </Link>

          <div className="mt-7">
            <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Today
            </p>
            <PortalNavigation portal="member" />
            <NotificationLink count={unread.count} />
          </div>

          <form action={memberLogout} className="mt-auto pt-4">
            <button
              className="inline-flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
              type="submit"
            >
              <FiLogOut aria-hidden="true" /> Sign out
            </button>
          </form>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-purple-100 bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <PortalNavigation mobile portal="member" />
      </div>
    </div>
  );
}

function NotificationLink({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <Link
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className={compact ? "relative grid size-10 place-items-center rounded-xl bg-white text-slate-600 shadow-sm" : "relative mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-purple-50 hover:text-[#6b21a8]"}
      href="/member/notifications"
    >
      <FiBell aria-hidden="true" className="text-lg" />
      {!compact && <span>Notifications</span>}
      {count > 0 && (
        <span className={compact ? "absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-lime-400 px-1 text-[10px] font-black text-[#240046]" : "ml-auto grid min-h-5 min-w-5 place-items-center rounded-full bg-[#6b21a8] px-1 text-[10px] font-black text-white"}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
