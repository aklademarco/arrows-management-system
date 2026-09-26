import Link from "next/link";
import { FiGrid, FiUser, FiUsers } from "react-icons/fi";

import { getPastorResource } from "../pastor-api";

type DepartmentLeader = {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  title: string | null;
  startsAt: string;
  endsAt: string | null;
};

type Department = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  activeMemberCount: number;
  leaders: DepartmentLeader[];
};

export default async function PastorDepartmentsPage() {
  const departments = await getPastorResource<Department[]>("/departments");

  const activeDepartments = departments.filter(
    (department) => department.isActive,
  );

  return (
    <main className="min-h-screen p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-600">
            Church structure
          </p>

          <h1 className="mt-2 text-3xl font-black">Departments</h1>

          <p className="mt-2 text-sm text-slate-500">
            {activeDepartments.length} active department
            {activeDepartments.length === 1 ? "" : "s"}.
          </p>
        </header>

        {departments.length === 0 ? (
          <section className="mt-6 grid min-h-64 place-items-center rounded-2xl border border-dashed border-purple-200 bg-white text-center">
            <div>
              <FiGrid className="mx-auto text-5xl text-purple-300" />

              <h2 className="mt-4 text-xl font-black">No departments</h2>

              <p className="mt-2 text-sm text-slate-500">
                Departments will appear here once configured.
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {departments.map((department) => (
              <article
                className="rounded-2xl border border-purple-100 bg-white p-5"
                key={department.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-purple-50 text-xl text-purple-700">
                    <FiGrid />
                  </span>

                  <span
                    className={
                      department.isActive
                        ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                        : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
                    }
                  >
                    {department.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-black">{department.name}</h2>

                {department.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {department.description}
                  </p>
                )}

                <p className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600">
                  <FiUsers />
                  {department.activeMemberCount} active member
                  {department.activeMemberCount === 1 ? "" : "s"}
                </p>

                <div className="mt-5 border-t border-purple-50 pt-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Leadership
                  </p>

                  {department.leaders.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No active leader assigned.
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-3">
                      {department.leaders.map((leader) => (
                        <Link
                          className="flex items-center gap-3 rounded-xl bg-purple-50 p-3 transition hover:bg-purple-100"
                          href={`/pastor/members/${leader.memberId}`}
                          key={leader.id}
                        >
                          <span className="grid size-9 place-items-center rounded-full bg-white text-purple-700">
                            <FiUser />
                          </span>

                          <span>
                            <span className="block text-sm font-bold">
                              {leader.firstName} {leader.lastName}
                            </span>

                            <span className="block text-xs text-slate-500">
                              {leader.title ?? "Department Leader"}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
