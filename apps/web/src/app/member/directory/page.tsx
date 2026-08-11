import Link from "next/link";
import { FiChevronLeft, FiChevronRight, FiSearch, FiUsers } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getMemberResource } from "../member-api";

type DirectoryMember = {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  profilePhotoUrl: string | null;
  coverPhotoUrl: string | null;
  departments: { id: string; name: string }[];
};
type DirectoryPage = {
  items: DirectoryMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
type Department = { id: string; name: string; isActive: boolean };

export default async function MemberDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    departmentId?: string;
    page?: string;
  }>;
}) {
  const parameters = await searchParams;
  const requestedPage = Number(parameters.page ?? 1);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const query = new URLSearchParams({ page: String(page), limit: "24" });
  if (parameters.search?.trim()) query.set("search", parameters.search.trim());
  if (parameters.departmentId) query.set("departmentId", parameters.departmentId);
  const [directory, departments] = await Promise.all([
    getMemberResource<DirectoryPage>(`/members/directory?${query}`),
    getMemberResource<Department[]>("/departments"),
  ]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-extrabold text-[#6b21a8]">Our church family</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">People at Arrows</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">Learn names, recognize faces, and discover the teams people serve with.</p>
        </header>

        <form className="mt-7 grid gap-3 rounded-[1.75rem] border border-purple-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_16rem_auto]" method="get">
          <label className="relative">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f8f7fb] pl-11 pr-4 text-sm font-semibold outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100" defaultValue={parameters.search} name="search" placeholder="Search by name" />
          </label>
          <select className="h-12 rounded-2xl border border-slate-200 bg-[#f8f7fb] px-4 text-sm font-semibold outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100" defaultValue={parameters.departmentId ?? ""} name="departmentId">
            <option value="">All departments</option>
            {departments.filter((department) => department.isActive).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
          <button className="member-primary-action h-12 px-6" type="submit">Find people</button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-500">{directory.total} {directory.total === 1 ? "member" : "members"}</p>
          {(parameters.search || parameters.departmentId) && <Link className="text-sm font-extrabold text-[#6b21a8]" href="/member/directory">Clear filters</Link>}
        </div>

        {directory.items.length === 0 ? (
          <section className="mt-4 grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-purple-200 bg-white text-center">
            <div><FiUsers className="mx-auto text-5xl text-purple-300" /><h2 className="mt-4 text-xl font-black">No one found</h2><p className="mt-2 text-sm font-medium text-slate-500">Try another name or department.</p></div>
          </section>
        ) : (
          <section aria-label="Church members" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {directory.items.map((member) => {
              const name = `${member.firstName} ${member.lastName}`;
              return (
                <article className="overflow-hidden rounded-[1.75rem] border border-purple-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" key={member.id}>
                  <div className="h-24 bg-gradient-to-br from-[#4c0d72] via-[#6b21a8] to-[#9d4edd] bg-cover bg-center" style={member.coverPhotoUrl ? { backgroundImage: `linear-gradient(rgba(76,13,114,.3), rgba(76,13,114,.3)), url(${member.coverPhotoUrl})` } : undefined} />
                  <div className="px-5 pb-5">
                    <div className="-mt-10"><ProfileAvatar imageUrl={member.profilePhotoUrl} name={name} size="xl" /></div>
                    <h2 className="mt-3 text-lg font-black tracking-tight">{name}</h2>
                    {member.otherNames ? <p className="mt-0.5 text-xs font-semibold text-slate-400">Also known as {member.otherNames}</p> : null}
                    <div className="mt-4 flex min-h-7 flex-wrap gap-2">
                      {member.departments.length ? member.departments.map((department) => <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-extrabold text-[#6b21a8]" key={department.id}>{department.name}</span>) : <span className="text-xs font-semibold text-slate-400">Church member</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {directory.totalPages > 1 && (
          <nav aria-label="Directory pages" className="mt-7 flex items-center justify-between">
            {page > 1 ? <Link className="inline-flex items-center gap-2 font-extrabold text-[#6b21a8]" href={`/member/directory?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page - 1) })}`}><FiChevronLeft /> Previous</Link> : <span />}
            <span className="text-xs font-bold text-slate-400">Page {page} of {directory.totalPages}</span>
            {page < directory.totalPages ? <Link className="inline-flex items-center gap-2 font-extrabold text-[#6b21a8]" href={`/member/directory?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page + 1) })}`}>Next <FiChevronRight /></Link> : <span />}
          </nav>
        )}
      </div>
    </main>
  );
}
