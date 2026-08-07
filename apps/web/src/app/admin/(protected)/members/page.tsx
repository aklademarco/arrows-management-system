import Link from "next/link";
import { FiSearch, FiUsers } from "react-icons/fi";
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-400">
              People
            </p>
            <h1 className="mt-2 text-3xl font-bold">Member directory</h1>
            <p className="mt-2 text-slate-400">
              {members.total} approved member{members.total === 1 ? "" : "s"}
            </p>
          </div>
          <nav className="flex gap-5">
            <Link
              className="font-bold text-violet-400 hover:text-violet-300"
              href="/admin/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="font-bold text-violet-400 hover:text-violet-300"
              href="/admin/registrations"
            >
              Registration approvals
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
          <button className="rounded-lg bg-violet-600 px-5 font-bold text-white">
            Apply filters
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
          <div className="mt-8 grid gap-4">
            {members.items.map((member) => (
              <article
                className="rounded-2xl border border-white/10 bg-[#111318] p-5 shadow-sm"
                key={member.id}
              >
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">
                      {[member.firstName, member.otherNames, member.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {member.email}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {member.departments.map((department) => (
                        <Link
                          className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 hover:bg-violet-500/20"
                          href={`/admin/members?departmentId=${department.id}`}
                          key={department.id}
                        >
                          {department.name}
                          {department.isPrimary ? " · Primary" : ""}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-bold capitalize">
                      {member.accountStatus.toLowerCase()}
                    </span>
                    <Link
                      className="mt-4 block text-sm font-bold text-violet-400"
                      href={`/admin/members/${member.id}`}
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {members.totalPages > 1 ? (
          <nav className="mt-8 flex items-center justify-between">
            {members.page > 1 ? (
              <Link href={pageHref(members.page - 1)}>Previous</Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-slate-400">
              Page {members.page} of {members.totalPages}
            </span>
            {members.page < members.totalPages ? (
              <Link href={pageHref(members.page + 1)}>Next</Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
