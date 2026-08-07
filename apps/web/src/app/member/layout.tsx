import Link from "next/link";
import Image from "next/image";
import { FiBell, FiLogOut } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PortalNavigation } from "@/components/portal-navigation";
import { memberLogout } from "../login/actions";
import { getMemberProfile, getMemberResource } from "./member-api";
import type { MemberProfile } from "./member-types";

export default async function MemberLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [member, unread] = await Promise.all([
    getMemberProfile<MemberProfile>(),
    getMemberResource<{ count: number }>("/notifications/unread-count"),
  ]);
  const memberName = `${member.firstName} ${member.lastName}`;
  return (
    <div className="min-h-screen bg-[#f8f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-purple-100/80 bg-[#f8f7fb]/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <Link className="flex items-center gap-2" href="/member">
            <span className="grid size-9 place-items-center rounded-xl bg-[#6b21a8] font-black text-white">
              A
            </span>
            <span>
              <span className="block text-sm font-black leading-none text-[#240046]">
                ACMS
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Your church rhythm
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

      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-purple-100 bg-white px-5 py-6 lg:flex">
          <Link className="flex items-center gap-3 px-2" href="/member">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#6b21a8] text-lg font-black text-white shadow-[0_8px_24px_rgba(107,33,168,0.25)]">
              A
            </span>
            <span>
              <span className="block font-black tracking-tight text-[#240046]">
                Arrows ACMS
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Member experience
              </span>
            </span>
          </Link>

          <div className="mt-7 overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-[0_14px_35px_rgba(36,0,70,0.1)]">
            <div className="relative h-24 overflow-hidden bg-gradient-to-br from-[#7e32b5] to-[#b56ae0]">
              {member.coverPhotoUrl ? (
                <Image
                  alt={`${memberName} cover photo`}
                  className="object-cover object-center"
                  fill
                  sizes="248px"
                  src={member.coverPhotoUrl}
                  unoptimized
                />
              ) : null}
            </div>
            <div className="px-5 pb-5">
              <div className="-mt-7 w-fit rounded-full bg-white p-1">
                <ProfileAvatar
                  imageUrl={member.profilePhotoUrl}
                  name={memberName}
                  size="lg"
                />
              </div>
              <p className="mt-3 truncate text-sm font-black text-slate-950">
                {memberName}
              </p>
              <p className="mt-0.5 text-xs font-semibold capitalize text-slate-400">
                {member.membershipStatus.toLowerCase()} member
              </p>
              <Link
                className="mt-3 inline-flex text-xs font-extrabold text-[#6b21a8] hover:text-[#240046]"
                href="/member/profile"
              >
                View profile →
              </Link>
            </div>
          </div>

          <div className="mt-7">
            <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Today
            </p>
            <PortalNavigation portal="member" />
            <NotificationLink count={unread.count} />
          </div>

          <div className="mt-auto rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
            <p className="text-sm font-extrabold text-[#5b148d]">
              Stay connected
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Check in, review your activity, and keep your profile current.
            </p>
          </div>
          <form action={memberLogout} className="mt-4">
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
