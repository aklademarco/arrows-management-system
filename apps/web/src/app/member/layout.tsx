import Link from "next/link";
import {
  FiCalendar,
  FiHome,
  FiLogOut,
  FiMenu,
  FiUser,
} from "react-icons/fi";
import { memberLogout } from "../login/actions";

const navigation = [
  { href: "/member", label: "Dashboard", icon: FiHome },
  { href: "/member/attendance", label: "Attendance history", icon: FiCalendar },
  { href: "/member/profile", label: "My profile", icon: FiUser },
];

function NavigationLinks() {
  return (
    <nav aria-label="Member portal" className="grid gap-1">
      {navigation.map(({ href, label, icon: Icon }) => (
        <Link
          className="inline-flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-purple-50 hover:text-[#6b21a8]"
          href={href}
          key={href}
        >
          <Icon aria-hidden="true" className="text-lg" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SignOutButton() {
  return (
    <form action={memberLogout}>
      <button
        className="inline-flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"
        type="submit"
      >
        <FiLogOut aria-hidden="true" className="text-lg" />
        Sign out
      </button>
    </form>
  );
}

export default function MemberLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white lg:hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <Link className="font-bold text-[#240046]" href="/member">
            ACMS <span className="font-normal text-slate-500">Member portal</span>
          </Link>
          <details className="relative">
            <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">
              <FiMenu aria-hidden="true" className="text-xl" />
              <span className="sr-only">Open member navigation</span>
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <NavigationLinks />
              <div className="mt-2 border-t border-slate-100 pt-2">
                <SignOutButton />
              </div>
            </div>
          </details>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="hidden min-h-screen w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:block">
          <Link className="block px-3 text-lg font-bold text-[#240046]" href="/member">
            ACMS
          </Link>
          <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Member portal
          </p>
          <div className="mt-6">
            <NavigationLinks />
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4">
            <SignOutButton />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
