import Link from "next/link";
import { FiArrowUpRight, FiFilter, FiSearch, FiUsers } from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";

type Department = { id: string; name: string };
type Member = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string;
  phone: string | null;
  accountStatus: string;
  membershipStatus: string;
  departments: Array<{ id: string; name: string; isPrimary: boolean }>;
};
type MemberPage = {
  items: Member[];
  total: number;
  page: number;
  totalPages: number;
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    departmentId?: string;
    accountStatus?: string;
    page?: string;
  }>;
}) {
  const parameters = await searchParams;
  const query = new URLSearchParams();
  for (const key of [
    "search",
    "departmentId",
    "accountStatus",
    "page",
  ] as const) {
    if (parameters[key]) query.set(key, parameters[key]);
  }
  const [members, departments] = await Promise.all([
    getAdminResource<MemberPage>(`/members?${query.toString()}`),
    getAdminResource<Department[]>("/admin/registrations/department-options"),
  ]);
  const pageHref = (page: number) => {
    const nextQuery = new URLSearchParams(query);
    nextQuery.set("page", String(page));
    return `/admin/members?${nextQuery.toString()}`;
  };

  return (
    <main className="min-h-screen bg-[#090a0d] px-5 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-400">
              People
            </p>
            <h1 className="mt-2 text-3xl font-bold">Member directory</h1>
            <p className="mt-2 text-slate-400">
              {members.total} approved member{members.total === 1 ? "" : "s"}
            </p>
          </div>
          <nav>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-[#111318] px-4 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
              href="/admin/registrations"
            >
              Registration approvals <FiArrowUpRight aria-hidden="true" />
            </Link>
          </nav>
        </div>

        <form className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-[#111318] p-4 shadow-sm lg:grid-cols-[1fr_16rem_12rem_auto]">
          <label className="relative">
            <span className="sr-only">Search members</span>
            <FiSearch className="absolute left-3 top-3.5 text-slate-400" />
            <input
              className="h-11 w-full rounded-lg border border-white/15 pl-10 pr-3"
              defaultValue={parameters.search}
              name="search"
              placeholder="Search name, email, or phone"
            />
          </label>
          <select
            className="h-11 rounded-lg border border-white/15 bg-[#111318] px-3"
            defaultValue={parameters.departmentId ?? ""}
            name="departmentId"
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-lg border border-white/15 bg-[#111318] px-3"
            defaultValue={parameters.accountStatus ?? ""}
            name="accountStatus"
          >
            <option value="">Active and suspended</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-5 font-bold text-slate-950 transition hover:bg-white">
            <FiFilter aria-hidden="true" /> Apply filters
          </button>
        </form>

        {members.items.length === 0 ? (
          <section className="mt-8 grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/15 bg-[#111318] text-center">
            <div>
              <FiUsers className="mx-auto text-5xl text-violet-400" />
              <h2 className="mt-4 text-xl font-bold">No members found</h2>
            </div>
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-[#111318]">
            <div className="hidden grid-cols-[minmax(17rem,1.4fr)_minmax(12rem,1fr)_8rem_2.5rem] gap-5 border-b border-white/10 bg-white/[0.025] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid">
              <span>Member</span>
              <span>Department</span>
              <span>Status</span>
              <span className="sr-only">Open</span>
            </div>
            {members.items.map((member) => (
              <Link
                className="group grid gap-5 border-b border-white/[0.07] px-5 py-4 transition last:border-b-0 hover:bg-white/[0.035] md:grid-cols-[minmax(17rem,1.4fr)_minmax(12rem,1fr)_8rem_2.5rem] md:items-center"
                href={`/admin/members/${member.id}`}
                key={member.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-300 ring-1 ring-inset ring-violet-400/15">
                    {member.firstName[0]}{member.lastName[0]}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-100">
                      {[member.firstName, member.otherNames, member.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {member.email}{member.phone ? ` · ${member.phone}` : ""}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {member.departments.length === 0 ? (
                    <span className="text-xs text-slate-500">Unassigned</span>
                  ) : member.departments.map((department) => (
                    <span
                      className={department.isPrimary
                        ? "rounded-md border border-violet-400/20 bg-violet-400/10 px-2 py-1 text-xs font-medium text-violet-300"
                        : "rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-slate-400"}
                      key={department.id}
                    >
                      {department.name}{department.isPrimary ? " · Primary" : ""}
                    </span>
                  ))}
                </div>
                <div>
                  <span className={member.accountStatus === "ACTIVE"
                    ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300"
                    : "inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300"}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {member.accountStatus.toLowerCase()}
                  </span>
                </div>
                <FiArrowUpRight aria-hidden="true" className="hidden text-slate-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-300 md:block" />
              </Link>
            ))}
          </section>
        )}
        {members.totalPages > 1 ? (
          <nav className="mt-8 flex items-center justify-between">
            {members.page > 1 ? (
              <Link className="rounded-lg border border-white/10 bg-[#111318] px-4 py-2 text-sm font-semibold hover:border-white/20" href={pageHref(members.page - 1)}>Previous</Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-slate-400">
              Page {members.page} of {members.totalPages}
            </span>
            {members.page < members.totalPages ? (
              <Link className="rounded-lg border border-white/10 bg-[#111318] px-4 py-2 text-sm font-semibold hover:border-white/20" href={pageHref(members.page + 1)}>Next</Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
