import Image from "next/image";
import Link from "next/link";
import { FiLogOut, FiSearch, FiUserCheck } from "react-icons/fi";
import { AdminDashboardNavigation } from "@/components/admin-dashboard-navigation";
import { adminLogout } from "./registrations/actions";
import { getAdminResource } from "./registrations/admin-api";

export default async function AdminProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const account = await getAdminResource<{
    roles: string[];
    email: string;
    memberProfile?: { firstName: string; lastName: string } | null;
  }>("/auth/me");
  const showAuditLogs = account.roles.includes("SUPER_ADMIN");
  const name = account.memberProfile
    ? `${account.memberProfile.firstName} ${account.memberProfile.lastName}`
    : "Administrator";
  return (
    <div className="min-h-screen bg-[#e9edee] text-[#252b2d]">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-xl focus:bg-white focus:p-4"
      >
        Skip to content
      </a>
      <header className="flex flex-wrap items-center gap-2 px-4 py-4 sm:gap-4 sm:py-5 sm:px-6 lg:px-8">
        <Link
          href="/admin/dashboard"
          className="mr-auto flex shrink-0 items-center gap-2.5"
        >
          <Image
            src="/assets/arrows.PNG"
            alt="Arrows Church"
            width={38}
            height={38}
            className="rounded-xl bg-white p-1"
          />
          <span className="text-lg font-semibold tracking-tight">
            arrows<span className="font-normal text-slate-500"> / acms</span>
          </span>
        </Link>
        <form
          action="/admin/members"
          method="get"
          role="search"
          className="order-3 flex w-full items-center gap-2 rounded-full bg-white/70 px-4 sm:order-none sm:w-64"
        >
          <FiSearch aria-hidden="true" className="shrink-0 text-slate-500" />
          <label className="sr-only" htmlFor="admin-search">
            Search members
          </label>
          <input
            id="admin-search"
            name="search"
            type="search"
            maxLength={100}
            placeholder="Search members…"
            className="h-11 min-w-0 w-full bg-transparent text-sm outline-none"
          />
          <button
            type="submit"
            className="text-xs font-semibold text-slate-600 hover:text-black"
          >
            Go
          </button>
        </form>
        <Link
          href="/admin/registrations"
          aria-label="Review account approvals"
          title="Account approvals"
          className="hidden size-11 place-items-center rounded-full bg-white/70 text-lg hover:bg-white sm:grid"
        >
          <FiUserCheck aria-hidden="true" />
        </Link>
        <span
          title={name}
          aria-label={name}
          className="grid size-9 place-items-center rounded-full sm:size-11 bg-[#d4ddd3] text-sm font-semibold"
        >
          {name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")}
        </span>
        <form action={adminLogout}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="grid size-11 place-items-center rounded-full bg-white/70 hover:bg-white"
          >
            <FiLogOut aria-hidden="true" />
          </button>
        </form>
      </header>
      <div className="mx-4 border-b border-black/[0.06] pb-3 sm:mx-6 lg:ml-24 lg:mr-8">
        <AdminDashboardNavigation showAuditLogs={showAuditLogs} />
      </div>
      <div className="flex">
        <aside className="hidden w-20 shrink-0 py-6 lg:block">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <AdminDashboardNavigation showAuditLogs={showAuditLogs} rail />
          </div>
        </aside>
        <div id="admin-content" className="admin-shell min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
