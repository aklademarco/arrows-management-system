import Link from "next/link";
import { FiArrowLeft, FiGrid, FiUsers } from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";
import {
  createDepartment,
  deactivateDepartment,
  updateDepartment,
} from "./actions";

type Department = {
  id: string;
  name: string;
  activeMemberCount: number;
  description: string | null;
  isActive: boolean;
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
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Create department</h2>
          <form
            action={createDepartment}
            className="mt-4 grid gap-3 md:grid-cols-[16rem_1fr_auto]"
          >
            <input
              className="h-11 rounded-lg border border-slate-300 px-3"
              minLength={2}
              name="name"
              placeholder="Department name"
              required
            />
            <input
              className="h-11 rounded-lg border border-slate-300 px-3"
              name="description"
              placeholder="Description (optional)"
            />
            <button className="rounded-lg bg-[#240046] px-5 font-bold text-white">
              Create
            </button>
          </form>
        </section>
        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              key={department.id}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-purple-50 text-xl text-[#6b21a8]">
                <FiGrid aria-hidden="true" />
              </span>
              <div className="mt-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{department.name}</h2>
                <span
                  className={
                    department.isActive
                      ? "rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800"
                      : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                  }
                >
                  {department.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {department.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {department.description}
                </p>
              ) : null}
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
              <details className="mt-5 border-t border-slate-100 pt-4">
                <summary className="cursor-pointer text-sm font-bold text-[#6b21a8]">
                  Edit department
                </summary>
                <form action={updateDepartment} className="mt-4 grid gap-3">
                  <input
                    name="departmentId"
                    type="hidden"
                    value={department.id}
                  />
                  <input
                    className="h-10 rounded-lg border border-slate-300 px-3"
                    defaultValue={department.name}
                    minLength={2}
                    name="name"
                    required
                  />
                  <textarea
                    className="min-h-24 rounded-lg border border-slate-300 p-3"
                    defaultValue={department.description ?? ""}
                    name="description"
                    placeholder="Description"
                  />
                  <button className="h-10 rounded-lg bg-[#240046] px-4 font-bold text-white">
                    Save changes
                  </button>
                </form>
              </details>
              {department.isActive ? (
                <form
                  action={deactivateDepartment}
                  className="mt-4 border-t border-red-100 pt-4"
                >
                  <input
                    name="departmentId"
                    type="hidden"
                    value={department.id}
                  />
                  <button className="text-sm font-bold text-red-700 hover:text-red-900">
                    Deactivate department
                  </button>
                </form>
              ) : null}
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
