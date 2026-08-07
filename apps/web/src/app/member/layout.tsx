import Link from "next/link";
import { FiLogOut } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PortalNavigation } from "@/components/portal-navigation";
import { memberLogout } from "../login/actions";

export default function MemberLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f8f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-purple-100/80 bg-[#f8f7fb]/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <Link className="flex items-center gap-2" href="/member">
            <span className="grid size-9 place-items-center rounded-xl bg-[#6b21a8] font-black text-white">A</span>
            <span>
              <span className="block text-sm font-black leading-none text-[#240046]">ACMS</span>
              <span className="text-xs font-semibold text-slate-400">Your church rhythm</span>
            </span>
          </Link>
          <Link aria-label="Open profile" href="/member/profile">
            <ProfileAvatar name="Member" size="sm" />
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-purple-100 bg-white px-5 py-6 lg:flex">
          <Link className="flex items-center gap-3 px-2" href="/member">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#6b21a8] text-lg font-black text-white shadow-[0_8px_24px_rgba(107,33,168,0.25)]">A</span>
            <span>
              <span className="block font-black tracking-tight text-[#240046]">Arrows ACMS</span>
              <span className="text-xs font-semibold text-slate-400">Member experience</span>
            </span>
          </Link>

          <div className="mt-8 rounded-3xl bg-gradient-to-br from-[#2d0750] to-[#6b21a8] p-5 text-white shadow-[0_18px_45px_rgba(36,0,70,0.18)]">
            <div className="flex items-center gap-3">
              <ProfileAvatar name="Member" size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">Your profile</p>
                <p className="text-xs text-purple-200">Active member</p>
              </div>
            </div>
            <Link className="mt-4 inline-flex text-xs font-bold text-lime-300 hover:text-white" href="/member/profile">View profile →</Link>
          </div>

          <div className="mt-7">
            <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Today</p>
            <PortalNavigation portal="member" />
          </div>

          <div className="mt-auto rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
            <p className="text-sm font-extrabold text-[#5b148d]">Stay connected</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Check in, review your activity, and keep your profile current.</p>
          </div>
          <form action={memberLogout} className="mt-4">
            <button className="inline-flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" type="submit">
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
