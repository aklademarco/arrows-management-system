import Link from "next/link";
import { FiArrowLeft, FiGrid, FiUsers } from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";
import {
  assignDepartmentLeader,
  createDepartment,
  deactivateDepartment,
  revokeDepartmentLeader,
  updateDepartment,
} from "./actions";

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
  activeMemberCount: number;
  description: string | null;
  isActive: boolean;
  leaders: DepartmentLeader[];
};

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  departments: { id: string }[];
};

type MemberPage = {
  items: Member[];
};

export default async function DepartmentsPage() {
  const [departments, memberPage] = await Promise.all([
    getAdminResource<Department[]>("/departments"),
    getAdminResource<MemberPage>("/members?limit=100"),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-[#090a0d] px-5 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <Link
          className="inline-flex items-center gap-2 font-bold text-violet-400"
          href="/admin/dashboard"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to dashboard
        </Link>
        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-400">
            Organization
          </p>
          <h1 className="mt-2 text-3xl font-bold">Departments</h1>
          <p className="mt-2 text-slate-400">
            {departments.length} department
            {departments.length === 1 ? "" : "s"} configured.
          </p>
        </div>
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-sm">
          <h2 className="text-xl font-bold">Create department</h2>
          <form
            action={createDepartment}
            className="mt-4 grid gap-3 md:grid-cols-[16rem_1fr_auto]"
          >
            <input
              className="h-11 rounded-lg border border-white/15 px-3"
              minLength={2}
              name="name"
              placeholder="Department name"
              required
            />
            <input
              className="h-11 rounded-lg border border-white/15 px-3"
              name="description"
              placeholder="Description (optional)"
            />
            <button className="rounded-lg bg-violet-600 px-5 font-bold text-white">
              Create
            </button>
          </form>
        </section>
        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <article
              className="rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-sm"
              key={department.id}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-violet-500/10 text-xl text-violet-400">
                <FiGrid aria-hidden="true" />
              </span>
              <div className="mt-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{department.name}</h2>
                <span
                  className={
                    department.isActive
                      ? "rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800"
                      : "rounded-full bg-white/[0.07] px-3 py-1 text-xs font-bold text-slate-400"
                  }
                >
                  {department.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {department.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {department.description}
                </p>
              ) : null}
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                <FiUsers aria-hidden="true" />
                {department.activeMemberCount} active member
                {department.activeMemberCount === 1 ? "" : "s"}
              </p>
              <div className="mt-4 rounded-xl bg-[#090a0d] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Department leadership
                </p>
                {department.leaders.length > 0 ? (
                  <div className="mt-3 grid gap-3">
                    {department.leaders.map((leader) => (
                      <div key={leader.id}>
                        <p className="font-bold">
                          {leader.firstName} {leader.lastName}
                        </p>
                        <p className="text-sm text-slate-400">
                          {leader.title ?? "Department Leader"}
                        </p>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-bold text-red-700">
                            End leadership
                          </summary>
                          <form
                            action={revokeDepartmentLeader}
                            className="mt-2 grid gap-2"
                          >
                            <input
                              name="departmentId"
                              type="hidden"
                              value={department.id}
                            />
                            <input
                              name="assignmentId"
                              type="hidden"
                              value={leader.id}
                            />
                            <input
                              className="h-9 rounded-lg border border-white/15 px-3 text-sm"
                              minLength={3}
                              name="reason"
                              placeholder="Reason"
                              required
                            />
                            <button className="h-9 rounded-lg border border-red-200 font-bold text-red-700">
                              Confirm end
                            </button>
                          </form>
                        </details>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    No active leader assigned.
                  </p>
                )}
              </div>
              <Link
                className="mt-5 inline-flex text-sm font-bold text-violet-400"
                href={`/admin/members?departmentId=${department.id}`}
              >
                View members
              </Link>
              {department.isActive ? (
                <details className="mt-5 border-t border-white/[0.07] pt-4">
                  <summary className="cursor-pointer text-sm font-bold text-violet-400">
                    Assign department leader
                  </summary>
                  <form
                    action={assignDepartmentLeader}
                    className="mt-4 grid gap-3"
                  >
                    <input
                      name="departmentId"
                      type="hidden"
                      value={department.id}
                    />
                    <select
                      className="h-10 rounded-lg border border-white/15 px-3"
                      name="memberId"
                      required
                    >
                      <option value="">Select department member</option>
                      {memberPage.items
                        .filter((member) =>
                          member.departments.some(
                            (membership) =>
                              membership.id === department.id,
                          ),
                        )
                        .map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                          </option>
                        ))}
                    </select>
                    <input
                      className="h-10 rounded-lg border border-white/15 px-3"
                      maxLength={100}
                      minLength={2}
                      name="title"
                      placeholder="Leadership title (optional)"
                    />
                    <label className="grid gap-1 text-xs font-bold text-slate-400">
                      Starts on
                      <input
                        className="h-10 rounded-lg border border-white/15 px-3"
                        defaultValue={today}
                        name="startsAt"
                        type="date"
                        required
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-slate-400">
                      Ends on (optional)
                      <input
                        className="h-10 rounded-lg border border-white/15 px-3"
                        min={today}
                        name="endsAt"
                        type="date"
                      />
                    </label>
                    <button className="h-10 rounded-lg bg-violet-600 px-4 font-bold text-white">
                      Assign leader
                    </button>
                  </form>
                </details>
              ) : null}
              <details className="mt-5 border-t border-white/[0.07] pt-4">
                <summary className="cursor-pointer text-sm font-bold text-violet-400">
                  Edit department
                </summary>
                <form action={updateDepartment} className="mt-4 grid gap-3">
                  <input
                    name="departmentId"
                    type="hidden"
                    value={department.id}
                  />
                  <input
                    className="h-10 rounded-lg border border-white/15 px-3"
                    defaultValue={department.name}
                    minLength={2}
                    name="name"
                    required
                  />
                  <textarea
                    className="min-h-24 rounded-lg border border-white/15 p-3"
                    defaultValue={department.description ?? ""}
                    name="description"
                    placeholder="Description"
                  />
                  <button className="h-10 rounded-lg bg-violet-600 px-4 font-bold text-white">
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
          <p className="mt-8 rounded-2xl border border-dashed p-10 text-center text-slate-400">
            No departments configured.
          </p>
        ) : null}
      </div>
    </main>
  );
}
