import Link from "next/link";
import { FiChevronRight, FiSearch, FiUsers } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getLeaderResource } from "../leader-api";

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  profilePhotoUrl: string | null;
};
type Team = {
  items: Person[];
  total: number;
  page: number;
  totalPages: number;
};

export default async function LeaderPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const parameters = await searchParams;
  const requestedPage = Number(parameters.page ?? 1);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const query = new URLSearchParams({ limit: "24", page: String(page) });
  if (parameters.search?.trim())
    query.set("search", parameters.search.trim().slice(0, 100));
  const team = await getLeaderResource<Team>(
    `/leadership-messages/team?${query}`,
  );
  function pageLink(next: number) {
    const nextQuery = new URLSearchParams(query);
    nextQuery.set("page", String(next));
    return `/leader/people?${nextQuery}`;
  }
  return (
    <main className="min-h-screen p-4 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-extrabold text-[#6b21a8]">
            Your departments
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            People you lead
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            View your team and select a person to send a private in-app message.
          </p>
        </header>
        <form className="mt-7" method="get" role="search">
          <label className="relative block w-full">
            <span className="sr-only">Search your team by name</span>
            <input
              className="h-14 w-full rounded-2xl border border-purple-100 bg-white px-4 pr-14 text-sm font-semibold shadow-sm outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              defaultValue={parameters.search}
              name="search"
              maxLength={100}
              placeholder="Search by name"
              type="search"
            />
            <button
              aria-label="Search your team"
              className="absolute right-1.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-xl text-[#6b21a8] hover:bg-purple-50"
              type="submit"
            >
              <FiSearch />
            </button>
          </label>
        </form>
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-500">
            {team.total} {team.total === 1 ? "person" : "people"}
          </p>
          {parameters.search ? (
            <Link
              className="text-sm font-extrabold text-[#6b21a8]"
              href="/leader/people"
            >
              Clear search
            </Link>
          ) : null}
        </div>
        {team.items.length ? (
          <ul
            aria-label="Your team members"
            className="mt-4 overflow-hidden rounded-[1.75rem] border border-purple-100 bg-white shadow-sm"
          >
            {team.items.map((person) => {
              const name = `${person.firstName} ${person.lastName}`;
              return (
                <li
                  className="border-b border-purple-50 last:border-b-0"
                  key={person.id}
                >
                  <Link
                    className="flex min-h-20 items-center gap-4 px-4 py-3 hover:bg-purple-50/70 sm:px-5"
                    href={`/leader/people/${person.id}`}
                  >
                    <ProfileAvatar
                      imageUrl={person.profilePhotoUrl}
                      name={name}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-medium capitalize sm:text-lg">
                        {name}
                      </h2>
                      {person.otherNames ? (
                        <p className="mt-0.5 truncate text-xs font-semibold capitalize text-slate-400">
                          {person.otherNames}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs font-semibold text-purple-700">
                        View profile and message
                      </p>
                    </div>
                    <FiChevronRight className="text-xl text-slate-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <section className="mt-4 grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-purple-200 bg-white p-6 text-center">
            <div>
              <FiUsers className="mx-auto text-5xl text-purple-300" />
              <h2 className="mt-4 text-xl font-black">No team members found</h2>
              <p className="mt-2 text-sm text-slate-500">
                {parameters.search
                  ? "Try another name."
                  : "Members appear here when you have an active department leadership assignment and members belong to that department."}
              </p>
            </div>
          </section>
        )}
        {team.totalPages > 1 && (
          <nav
            aria-label="Team pages"
            className="mt-6 flex items-center justify-between gap-4"
          >
            {page > 1 ? (
              <Link
                className="rounded-xl border px-4 py-3"
                href={pageLink(page - 1)}
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm">
              Page {page} of {team.totalPages}
            </span>
            {page < team.totalPages ? (
              <Link
                className="rounded-xl border px-4 py-3"
                href={pageLink(page + 1)}
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
