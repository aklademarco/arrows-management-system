import Link from "next/link";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";

import { MemberDirectoryGrid } from "@/components/members/member-directory-grid";
import type { DirectoryMember } from "@/components/members/member-directory-card";

import { getPastorResource } from "../pastor-api";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  profilePhotoUrl?: string | null;
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
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
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

  const directoryMembers: DirectoryMember[] = members.items.map((member) => {
    const displayName = [member.firstName, member.otherNames, member.lastName]
      .filter(Boolean)
      .join(" ");

    const primaryDepartment = member.departments.find(
      (department) => department.isPrimary,
    );

    const firstDepartment = primaryDepartment ?? member.departments[0];

    return {
      id: member.id,
      displayName,
      profilePhotoUrl: member.profilePhotoUrl,
      subtitle: firstDepartment?.name ?? member.membershipStatus,
      href: `/pastor/members/${member.id}`,
    };
  });

  const pageHref = (page: number) => {
    const nextQuery = new URLSearchParams(query);

    nextQuery.set("page", String(page));

    return `/pastor/members?${nextQuery.toString()}`;
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1400px]">
        <header>
          <p className="text-sm font-bold text-purple-600">Church family</p>

          <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Members
              </h1>

              <p className="mt-2 text-sm font-medium text-slate-500">
                {members.total} member
                {members.total === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </header>

        <form className="relative mt-6 max-w-xl" role="search">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            defaultValue={parameters.search}
            name="search"
            placeholder="Search members"
            type="search"
          />
        </form>

        <section className="mt-8">
          <MemberDirectoryGrid members={directoryMembers} />
        </section>

        {members.totalPages > 1 && (
          <nav
            aria-label="Member pages"
            className="mt-10 flex items-center justify-between border-t border-slate-200 pt-5"
          >
            {members.page > 1 ? (
              <Link
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                href={pageHref(members.page - 1)}
              >
                <FiChevronLeft />
                Previous
              </Link>
            ) : (
              <span />
            )}

            <span className="text-xs font-bold text-slate-400">
              {members.page} / {members.totalPages}
            </span>

            {members.page < members.totalPages ? (
              <Link
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                href={pageHref(members.page + 1)}
              >
                Next
                <FiChevronRight />
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
