import Link from "next/link";
import { FiBell, FiCommand, FiLogOut, FiMenu, FiSearch } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PortalNavigation } from "@/components/portal-navigation";
import { adminLogout } from "./registrations/actions";
import { getAdminResource } from "./registrations/admin-api";

function SignOutButton() {
  return (
    <form action={adminLogout}>
      <button
        className="inline-flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/[0.07] hover:text-slate-100"
        type="submit"
      >
        <FiLogOut aria-hidden="true" /> Sign out
      </button>
    </form>
  );
}

export default async function AdminProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const account = await getAdminResource<{ roles: string[] }>("/auth/me");
  const showAuditLogs = account.roles.includes("SUPER_ADMIN");
  return (
    <div className="admin-shell min-h-screen bg-[#090a0d] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d0f13]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            className="flex items-center gap-2 font-semibold"
            href="/admin/dashboard"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-violet-500 text-xs font-black text-white shadow-[0_0_24px_rgba(139,92,246,0.28)]">
              A
            </span>
            ACMS Admin
          </Link>
          <details className="relative">
            <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-lg border border-white/10 text-slate-400 hover:bg-[#090a0d]">
              <FiMenu aria-hidden="true" />
              <span className="sr-only">Open administration navigation</span>
            </summary>
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#111318] p-3 shadow-2xl">
              <PortalNavigation portal="admin" showAuditLogs={showAuditLogs} />
              <div className="mt-2 border-t border-white/[0.07] pt-2">
                <SignOutButton />
              </div>
            </div>
          </details>
        </div>
      </header>

      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#111318] px-3 py-4 lg:flex">
          <div className="flex items-center justify-between px-2 pb-4">
            <Link className="flex items-center gap-2" href="/admin/dashboard">
              <span className="grid size-8 place-items-center rounded-lg bg-violet-500 text-xs font-black text-white shadow-[0_0_24px_rgba(139,92,246,0.28)]">
                A
              </span>
              <span className="text-sm font-semibold">Arrows ACMS</span>
            </Link>
            <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              ADMIN
            </span>
          </div>

          <button
            className="mb-4 flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-left text-sm text-slate-400 shadow-sm hover:bg-[#090a0d]"
            type="button"
          >
            <FiSearch aria-hidden="true" /> Search workspace
            <span className="ml-auto inline-flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[10px]">
              <FiCommand aria-hidden="true" />K
            </span>
          </button>

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Workspace
          </p>
          <PortalNavigation portal="admin" showAuditLogs={showAuditLogs} />

          <div className="mt-auto border-t border-white/[0.07] pt-3">
            <Link
              className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#090a0d]"
              href="/admin/dashboard"
            >
              <ProfileAvatar name="Administrator" size="sm" variant="admin" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  Administrator
                </span>
                <span className="block text-xs text-slate-400">
                  Church workspace
                </span>
              </span>
            </Link>
            <SignOutButton />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="hidden h-14 items-center justify-end gap-2 border-b border-white/10 bg-[#111318] px-6 lg:flex">
            <button
              aria-label="Notifications"
              className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.07]"
              type="button"
            >
              <FiBell aria-hidden="true" />
            </button>
            <ProfileAvatar name="Administrator" size="sm" variant="admin" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
