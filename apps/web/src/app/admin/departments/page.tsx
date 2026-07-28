import Link from "next/link";
import { FiArrowLeft, FiGrid, FiUsers } from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";

type Department = {
  id: string;
  name: string;
  activeMemberCount: number;
};

export default async function DepartmentsPage() {
  const departments = await getAdminResource<Department[]>("/departments");

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <Link
          className="inline-flex items-center gap-2 font-bold text-[#6b21a8]"
          href="/admin/dashboard"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to dashboard
        </Link>
        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6b21a8]">
            Organization
          </p>
          <h1 className="mt-2 text-3xl font-bold">Departments</h1>
          <p className="mt-2 text-slate-600">
            {departments.length} department
            {departments.length === 1 ? "" : "s"} configured.
          </p>
        </div>
        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              key={department.id}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-purple-50 text-xl text-[#6b21a8]">
                <FiGrid aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-bold">{department.name}</h2>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <FiUsers aria-hidden="true" />
                {department.activeMemberCount} active member
                {department.activeMemberCount === 1 ? "" : "s"}
              </p>
              <Link
                className="mt-5 inline-flex text-sm font-bold text-[#6b21a8]"
                href={`/admin/members?departmentId=${department.id}`}
              >
                View members
              </Link>
            </article>
          ))}
        </section>
        {departments.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed p-10 text-center text-slate-600">
            No departments configured.
          </p>
        ) : null}
      </div>
    </main>
  );
}
