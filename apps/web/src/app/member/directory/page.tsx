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
  directoryBio: string | null;
  phone: string | null;
  skills: string[];
  departments: { id: string; name: string }[];
};
type DirectoryPage = {
  items: DirectoryMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
export default async function MemberDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}) {
  const parameters = await searchParams;
  const requestedPage = Number(parameters.page ?? 1);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const query = new URLSearchParams({ page: String(page), limit: "24" });
  if (parameters.search?.trim()) query.set("search", parameters.search.trim());
  const directory = await getMemberResource<DirectoryPage>(`/members/directory?${query}`);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-extrabold text-[#6b21a8]">Our church family</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">People at Arrows</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">Learn names, recognize faces, and discover the teams people serve with.</p>
        </header>

        <form className="mt-7" method="get" role="search">
          <label className="relative block w-full">
            <span className="sr-only">Search people by name</span>
            <input className="h-14 w-full rounded-2xl border border-purple-100 bg-white px-4 pr-14 text-sm font-semibold shadow-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100" defaultValue={parameters.search} name="search" placeholder="Search by name" type="search" />
            <button aria-label="Search people" className="absolute right-1.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-xl text-[#6b21a8] transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-100" type="submit">
              <FiSearch aria-hidden="true" />
            </button>
          </label>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-500">{directory.total} {directory.total === 1 ? "member" : "members"}</p>
          {parameters.search && <Link className="text-sm font-extrabold text-[#6b21a8]" href="/member/directory">Clear search</Link>}
        </div>

        {directory.items.length === 0 ? (
          <section className="mt-4 grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-purple-200 bg-white text-center">
            <div><FiUsers className="mx-auto text-5xl text-purple-300" /><h2 className="mt-4 text-xl font-black">No one found</h2><p className="mt-2 text-sm font-medium text-slate-500">Try another name.</p></div>
          </section>
        ) : (
          <ul aria-label="Church members" className="mt-4 overflow-hidden rounded-[1.75rem] border border-purple-100 bg-white shadow-sm">
            {directory.items.map((member) => {
              const name = `${member.firstName} ${member.lastName}`;
              return (
                <li className="border-b border-purple-50 last:border-b-0" key={member.id}>
                  <Link className="flex min-h-20 items-center gap-4 px-4 py-3 transition hover:bg-purple-50/70 focus-visible:bg-purple-50 focus-visible:outline-none sm:px-5" href={`/member/directory/${member.id}`}>
                    <ProfileAvatar imageUrl={member.profilePhotoUrl} name={name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-black tracking-tight text-slate-950 sm:text-lg">{name}</h2>
                      {member.otherNames ? <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">{member.otherNames}</p> : null}
                    </div>
                    <FiChevronRight aria-hidden="true" className="shrink-0 text-xl text-slate-300" />
                    <span className="sr-only">View {name}&apos;s profile</span>
                  </Link>
                </li>
              );
            })}
          </ul>
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
