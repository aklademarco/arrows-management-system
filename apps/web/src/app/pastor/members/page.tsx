import Link from "next/link";
import { FiChevronRight, FiSearch, FiUsers } from "react-icons/fi";
import { getPastorResource } from "../pastor-api";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string;
  phone: string | null;
  accountStatus: string;
  membershipStatus: string;
  departments: {
    id: string;
    name: string;
    isPrimary: boolean;
  }[];
};

type MemberPage = {
  items: Member[];
  total: number;
  page: number;
  totalPages: number;
};

export default async function PastorMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const parameters = await searchParams;

  const query = new URLSearchParams();

  if (parameters.search) {
    query.set("search", parameters.search);
  }

  if (parameters.page) {
    query.set("page", parameters.page);
  }

  const members = await getPastorResource<MemberPage>(
    `/members?${query.toString()}`,
  );

  const pageHref = (page: number) => {
    const nextQuery = new URLSearchParams(query);

    nextQuery.set("page", String(page));

    return `/pastor/members?${nextQuery.toString()}`;
  };

  return (
    <main className="min-h-screen p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-600">
            Church family
          </p>

          <h1 className="mt-2 text-3xl font-black">Members</h1>

          <p className="mt-2 text-sm text-slate-500">
            {members.total} member{members.total === 1 ? "" : "s"}
          </p>
        </header>

        <form className="relative mt-6" role="search">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            className="h-12 w-full rounded-xl border border-purple-100 bg-white pl-11 pr-4 outline-none focus:border-purple-300"
            defaultValue={parameters.search}
            name="search"
            placeholder="Search name, email or phone"
            type="search"
          />
        </form>

        {members.items.length === 0 ? (
          <div className="mt-6 grid min-h-64 place-items-center rounded-2xl border border-dashed border-purple-200 bg-white text-center">
            <div>
              <FiUsers className="mx-auto text-4xl text-purple-300" />

              <p className="mt-3 font-bold">No members found</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-purple-100 bg-white">
            {members.items.map((member) => (
              <Link
                className="flex items-center gap-4 border-b border-purple-50 p-4 transition last:border-0 hover:bg-purple-50"
                href={`/pastor/members/${member.id}`}
                key={member.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {[member.firstName, member.otherNames, member.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </p>

                  <p className="mt-1 truncate text-sm text-slate-500">
                    {member.email}
                    {member.phone ? ` · ${member.phone}` : ""}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {member.departments.map((department) => (
                      <span
                        className={
                          department.isPrimary
                            ? "rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800"
                            : "rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700"
                        }
                        key={department.id}
                      >
                        {department.name}
                        {department.isPrimary ? " · Primary" : ""}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {member.membershipStatus}
                  </span>

                  <FiChevronRight
                    aria-hidden="true"
                    className="text-slate-300"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}

        {members.totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-between">
            {members.page > 1 ? (
              <Link
                className="rounded-xl border border-purple-100 bg-white px-4 py-2 text-sm font-bold transition hover:bg-purple-50"
                href={pageHref(members.page - 1)}
              >
                Previous
              </Link>
            ) : (
              <span />
            )}

            <span className="text-sm text-slate-500">
              Page {members.page} of {members.totalPages}
            </span>

            {members.page < members.totalPages ? (
              <Link
                className="rounded-xl border border-purple-100 bg-white px-4 py-2 text-sm font-bold transition hover:bg-purple-50"
                href={pageHref(members.page + 1)}
              >
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
